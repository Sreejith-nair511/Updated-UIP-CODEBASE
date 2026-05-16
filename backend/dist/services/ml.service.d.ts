import { CircuitState } from "../lib/circuit-breaker";
export interface MLPrediction {
    leak_class: "no_leak" | "minor_leak" | "major_leak";
    no_leak_prob: number;
    minor_leak_prob: number;
    major_leak_prob: number;
    severity_estimate: number;
    confidence: number;
    inference_ms: number;
    model_version: string;
    distribution_shift_warning?: boolean;
}
export interface MLFeatures {
    pressure_bar: number;
    flow_lpm: number;
    frequency_hz: number;
    temp_c: number;
    humidity_pct: number;
    anomaly_score: number;
    dominant_frequency?: number;
    signal?: number[];
    sample_rate?: number;
    input_format?: string;
}
/**
 * Call the Python ML inference service with circuit breaker and caching.
 * Falls back to rule-based heuristic if service is unavailable.
 */
export declare function runMLInference(features: MLFeatures, traceId?: string): Promise<MLPrediction>;
export declare function getMLServiceStats(): {
    circuitBreaker: {
        state: CircuitState;
        failureCount: number;
        successCount: number;
        lastFailureTime: number;
        nextAttemptTime: number;
    };
    cache: {
        size: number;
    };
};
/**
 * Upload a local WAV file to the ML service simulation endpoint.
 * Returns a prediction result identical to runMLInference.
 *
 * @throws Error if the WAV file is not found at filePath.
 */
export declare function simulateFromWav(filePath: string): Promise<MLPrediction>;
//# sourceMappingURL=ml.service.d.ts.map