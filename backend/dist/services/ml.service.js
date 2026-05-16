"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMLInference = runMLInference;
exports.getMLServiceStats = getMLServiceStats;
exports.simulateFromWav = simulateFromWav;
const fs_1 = __importDefault(require("fs"));
const form_data_1 = __importDefault(require("form-data"));
const config_1 = require("../config");
const logger_1 = require("../lib/logger");
const zod_1 = require("zod");
const circuit_breaker_1 = require("../lib/circuit-breaker");
const cache_1 = require("../lib/cache");
const tracing_1 = require("../lib/tracing");
// ── Circuit breaker for ML service ────────────────────────────────────────────
const mlCircuitBreaker = new circuit_breaker_1.CircuitBreaker({
    failureThreshold: 3, // Open after 3 failures
    recoveryTimeout: 30000, // Wait 30s before retry
    monitoringPeriod: 60000, // 1 minute window
    successThreshold: 2, // Need 2 successes to close
});
// ── Response validation schemas ──────────────────────────────────────────────
const MLServiceResponseSchema = zod_1.z.object({
    leak_class: zod_1.z.string(),
    leak_class_id: zod_1.z.number().int().min(0).max(3),
    confidence: zod_1.z.number().min(0).max(1),
    probabilities: zod_1.z.object({
        Normal: zod_1.z.number().min(0).max(1),
        "Pre-Leak": zod_1.z.number().min(0).max(1),
        "Minor Leak": zod_1.z.number().min(0).max(1),
        "Major Leak": zod_1.z.number().min(0).max(1),
    }),
    inference_ms: zod_1.z.number().positive(),
    model_version: zod_1.z.string(),
    distribution_shift_warning: zod_1.z.boolean().optional(),
});
// ── Class mapping ─────────────────────────────────────────────────────────────
/**
 * Map 4-class acoustic ML output to 3-class DB enum.
 * Pre-Leak (1) is treated as minor_leak — earliest detectable anomaly.
 */
function mapLeakClassId(id) {
    switch (id) {
        case 0: return "no_leak";
        case 1: return "minor_leak"; // Pre-Leak → minor_leak
        case 2: return "minor_leak"; // Minor Leak → minor_leak
        case 3: return "major_leak"; // Major Leak → major_leak
        default: return "no_leak";
    }
}
/**
 * Derive 3-class probabilities from 4-class probabilities.
 */
function mapProbabilities(probs) {
    return {
        no_leak_prob: parseFloat((probs.Normal ?? 0).toFixed(4)),
        minor_leak_prob: parseFloat(((probs["Pre-Leak"] ?? 0) + (probs["Minor Leak"] ?? 0)).toFixed(4)),
        major_leak_prob: parseFloat((probs["Major Leak"] ?? 0).toFixed(4)),
    };
}
/**
 * Estimate severity percentage from leak class and confidence.
 */
function estimateSeverity(leakClass, confidence, features) {
    if (leakClass === "no_leak")
        return 0;
    if (leakClass === "minor_leak") {
        return Math.min(Math.round(10 + confidence * 35), 49);
    }
    const freqFactor = features.frequency_hz > 50
        ? Math.min((features.frequency_hz - 50) / 30, 1) * 10
        : 0;
    return Math.min(Math.round(50 + confidence * 40 + freqFactor), 100);
}
// ── Main inference function ───────────────────────────────────────────────────
/**
 * Call the Python ML inference service with circuit breaker and caching.
 * Falls back to rule-based heuristic if service is unavailable.
 */
async function runMLInference(features, traceId) {
    const start = Date.now();
    // Check cache first (exclude signal from cache key for consistency)
    const cacheKey = cache_1.CacheKeys.mlPrediction({
        pressure_bar: features.pressure_bar,
        flow_lpm: features.flow_lpm,
        frequency_hz: features.frequency_hz,
        temp_c: features.temp_c,
        humidity_pct: features.humidity_pct,
        anomaly_score: features.anomaly_score,
        dominant_frequency: features.dominant_frequency,
    });
    const cached = cache_1.cache.get(cacheKey);
    if (cached) {
        logger_1.logger.debug("ML prediction cache hit", { traceId, cacheKey });
        return {
            ...cached,
            inference_ms: Date.now() - start, // Update timing
        };
    }
    try {
        // Use circuit breaker for ML service calls
        const prediction = await mlCircuitBreaker.execute(async () => {
            // Build request body — include signal if provided
            const requestBody = {
                pressure_bar: features.pressure_bar,
                flow_lpm: features.flow_lpm,
                frequency_hz: features.frequency_hz,
                temp_c: features.temp_c,
                humidity_pct: features.humidity_pct,
                anomaly_score: features.anomaly_score,
                dominant_frequency: features.dominant_frequency,
                sample_rate: features.sample_rate ?? 4000,
                input_format: features.input_format ?? "float_array",
            };
            // Include raw signal if available (enables acoustic CNN+RF inference)
            if (features.signal && features.signal.length > 0) {
                requestBody.signal = features.signal;
            }
            else {
                // Provide a minimal placeholder signal so the endpoint doesn't reject the request
                // The ML service will use feature-based heuristics when signal is too short
                requestBody.signal = new Array(8000).fill(0).map(() => Math.random() * 0.01);
            }
            const headers = {
                "Content-Type": "application/json",
                ...(0, tracing_1.createTraceHeaders)(traceId),
            };
            const response = await fetch(`${config_1.config.ml.serviceUrl}/predict`, {
                method: "POST",
                headers,
                body: JSON.stringify(requestBody),
                signal: AbortSignal.timeout(5000), // 5s timeout
            });
            if (!response.ok) {
                throw new Error(`ML service returned ${response.status}: ${response.statusText}`);
            }
            const rawResponse = await response.json();
            // Validate ML service response structure
            const validationResult = MLServiceResponseSchema.safeParse(rawResponse);
            if (!validationResult.success) {
                logger_1.logger.error("Invalid ML service response structure", {
                    traceId,
                    errors: validationResult.error.errors,
                    response: rawResponse,
                });
                throw new Error("ML service returned invalid response format");
            }
            return validationResult.data;
        });
        const roundTripMs = Date.now() - start;
        const leakClass = mapLeakClassId(prediction.leak_class_id);
        const { no_leak_prob, minor_leak_prob, major_leak_prob } = mapProbabilities(prediction.probabilities);
        const severityEstimate = estimateSeverity(leakClass, prediction.confidence, features);
        const result = {
            leak_class: leakClass,
            no_leak_prob,
            minor_leak_prob,
            major_leak_prob,
            severity_estimate: severityEstimate,
            confidence: parseFloat(prediction.confidence.toFixed(4)),
            inference_ms: roundTripMs,
            model_version: prediction.model_version,
            distribution_shift_warning: prediction.distribution_shift_warning,
        };
        // Cache the result (only if successful)
        cache_1.cache.set(cacheKey, result, cache_1.CacheTTL.ML_PREDICTION);
        logger_1.logger.debug("ML prediction cached", { traceId, cacheKey });
        return result;
    }
    catch (err) {
        const circuitState = mlCircuitBreaker.getState();
        logger_1.logger.warn("ML service unavailable, using heuristic fallback", {
            traceId,
            circuitState,
            error: err instanceof Error ? err.message : String(err),
        });
        return heuristicFallback(features, Date.now() - start);
    }
}
// ── Circuit breaker monitoring ───────────────────────────────────────────────
function getMLServiceStats() {
    return {
        circuitBreaker: mlCircuitBreaker.getStats(),
        cache: {
            size: cache_1.cache.size(),
        },
    };
}
/**
 * Upload a local WAV file to the ML service simulation endpoint.
 * Returns a prediction result identical to runMLInference.
 *
 * @throws Error if the WAV file is not found at filePath.
 */
async function simulateFromWav(filePath) {
    if (!fs_1.default.existsSync(filePath)) {
        throw new Error(`WAV file not found: ${filePath}`);
    }
    const start = Date.now();
    try {
        const form = new form_data_1.default();
        form.append("file", fs_1.default.createReadStream(filePath), {
            filename: filePath.split("/").pop() ?? "signal.wav",
            contentType: "audio/wav",
        });
        const response = await fetch(`${config_1.config.ml.serviceUrl}/simulate`, {
            method: "POST",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            body: form,
            headers: form.getHeaders(),
            signal: AbortSignal.timeout(10000), // 10s timeout for file upload
        });
        if (!response.ok) {
            throw new Error(`ML simulate endpoint returned ${response.status}: ${response.statusText}`);
        }
        const mlResponse = await response.json();
        const roundTripMs = Date.now() - start;
        const leakClass = mapLeakClassId(mlResponse.leak_class_id);
        const { no_leak_prob, minor_leak_prob, major_leak_prob } = mapProbabilities(mlResponse.probabilities);
        return {
            leak_class: leakClass,
            no_leak_prob,
            minor_leak_prob,
            major_leak_prob,
            severity_estimate: estimateSeverity(leakClass, mlResponse.confidence, {
                pressure_bar: 0,
                flow_lpm: 0,
                frequency_hz: 0,
                temp_c: 0,
                humidity_pct: 0,
                anomaly_score: 0,
            }),
            confidence: parseFloat(mlResponse.confidence.toFixed(4)),
            inference_ms: roundTripMs,
            model_version: mlResponse.model_version,
            distribution_shift_warning: mlResponse.distribution_shift_warning,
        };
    }
    catch (err) {
        logger_1.logger.warn("ML simulate endpoint unavailable", {
            error: err instanceof Error ? err.message : String(err),
            filePath,
        });
        throw err; // Re-throw for simulate — no heuristic fallback for WAV simulation
    }
}
// ── Heuristic fallback ────────────────────────────────────────────────────────
/**
 * Rule-based heuristic fallback when ML service is down.
 * Based on observed data patterns:
 * - Frequency > 30 Hz strongly correlates with leaks
 * - Anomaly score > 0.7 indicates high risk
 * - Pressure > 6.5 bar with high frequency = major leak
 */
function heuristicFallback(features, inferenceMs) {
    const { frequency_hz, anomaly_score, pressure_bar } = features;
    let noLeakProb;
    let minorLeakProb;
    let majorLeakProb;
    let severityEstimate;
    if (frequency_hz < 20 && anomaly_score < 0.3) {
        // Clearly no leak
        noLeakProb = 0.92;
        minorLeakProb = 0.06;
        majorLeakProb = 0.02;
        severityEstimate = 0;
    }
    else if (frequency_hz >= 20 && frequency_hz < 45 && anomaly_score >= 0.3) {
        // Minor leak territory
        const intensity = Math.min((frequency_hz - 20) / 25, 1);
        noLeakProb = 0.15 - intensity * 0.1;
        minorLeakProb = 0.65 + intensity * 0.1;
        majorLeakProb = 0.20 + intensity * 0.05;
        severityEstimate = 15 + intensity * 35;
    }
    else if (frequency_hz >= 45 || anomaly_score >= 0.85) {
        // Major leak territory
        const intensity = Math.min((frequency_hz - 45) / 30, 1);
        noLeakProb = 0.03;
        minorLeakProb = 0.12;
        majorLeakProb = 0.85 + intensity * 0.1;
        severityEstimate = 50 + intensity * 45 + (pressure_bar > 6.5 ? 10 : 0);
    }
    else {
        // Ambiguous
        noLeakProb = 0.45;
        minorLeakProb = 0.35;
        majorLeakProb = 0.20;
        severityEstimate = anomaly_score * 30;
    }
    // Normalize probabilities
    const total = noLeakProb + minorLeakProb + majorLeakProb;
    noLeakProb /= total;
    minorLeakProb /= total;
    majorLeakProb /= total;
    const maxProb = Math.max(noLeakProb, minorLeakProb, majorLeakProb);
    let leakClass;
    if (maxProb === noLeakProb)
        leakClass = "no_leak";
    else if (maxProb === minorLeakProb)
        leakClass = "minor_leak";
    else
        leakClass = "major_leak";
    return {
        leak_class: leakClass,
        no_leak_prob: parseFloat(noLeakProb.toFixed(4)),
        minor_leak_prob: parseFloat(minorLeakProb.toFixed(4)),
        major_leak_prob: parseFloat(majorLeakProb.toFixed(4)),
        severity_estimate: Math.min(Math.round(severityEstimate), 100),
        confidence: parseFloat(maxProb.toFixed(4)),
        inference_ms: inferenceMs,
        model_version: "heuristic_v1",
    };
}
//# sourceMappingURL=ml.service.js.map