"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processReading = processReading;
exports.processBatch = processBatch;
const supabase_1 = require("../lib/supabase");
const logger_1 = require("../lib/logger");
const ml_service_1 = require("./ml.service");
const alert_service_1 = require("./alert.service");
const tracing_1 = require("../lib/tracing");
async function processReading(payload, req) {
    const traceId = req ? (0, tracing_1.extractTraceId)(req) : undefined;
    logger_1.logger.info("Processing reading", {
        traceId,
        pipe_id: payload.pipe_id,
        zone_id: payload.zone_id
    });
    // 1. Validate pipe exists
    const { data: pipeExists, error: pipeError } = await supabase_1.supabase
        .from("pipes")
        .select("id")
        .eq("pipe_id", payload.pipe_id)
        .eq("zone_id", payload.zone_id)
        .single();
    if (pipeError || !pipeExists) {
        logger_1.logger.error("Invalid pipe_id or zone_id", {
            traceId,
            pipe_id: payload.pipe_id,
            zone_id: payload.zone_id,
            error: pipeError?.message
        });
        throw new Error(`Pipe ${payload.pipe_id} not found in zone ${payload.zone_id}`);
    }
    // 2. Run ML inference
    const prediction = await (0, ml_service_1.runMLInference)({
        pressure_bar: payload.pressure_bar,
        flow_lpm: payload.flow_lpm,
        frequency_hz: payload.frequency_hz,
        temp_c: payload.temp_c,
        humidity_pct: payload.humidity_pct,
        anomaly_score: payload.anomaly_score ?? 0,
        dominant_frequency: payload.dominant_frequency,
    }, traceId);
    // 3. Determine leak status from ML output
    const isLeak = prediction.leak_class !== "no_leak";
    const severityPct = isLeak ? prediction.severity_estimate : 0;
    // 4. Store reading in Supabase
    const { data: reading, error: readingError } = await supabase_1.supabase
        .from("readings")
        .insert({
        pipe_id: payload.pipe_id,
        zone_id: payload.zone_id,
        reading_date: payload.reading_date,
        reading_time: payload.reading_time,
        pressure_bar: payload.pressure_bar,
        flow_lpm: payload.flow_lpm,
        leak: isLeak,
        severity_pct: severityPct,
        frequency_hz: payload.frequency_hz,
        temp_c: payload.temp_c,
        humidity_pct: payload.humidity_pct,
        valve_status: payload.valve_status,
        anomaly_score: payload.anomaly_score ?? 0,
        dominant_frequency: payload.dominant_frequency ?? null,
        frequency_distribution: payload.frequency_distribution ?? null,
    })
        .select("id")
        .single();
    if (readingError || !reading) {
        logger_1.logger.error("Failed to store reading", {
            traceId,
            error: readingError?.message
        });
        throw new Error(`Failed to store reading: ${readingError?.message}`);
    }
    logger_1.logger.debug("Reading stored successfully", {
        traceId,
        reading_id: reading.id,
        leak_detected: isLeak
    });
    // 5. Store prediction
    const { error: predError } = await supabase_1.supabase.from("predictions").insert({
        reading_id: reading.id,
        pipe_id: payload.pipe_id,
        model_version: prediction.model_version,
        leak_class: prediction.leak_class,
        no_leak_prob: prediction.no_leak_prob,
        minor_leak_prob: prediction.minor_leak_prob,
        major_leak_prob: prediction.major_leak_prob,
        severity_estimate: prediction.severity_estimate,
        confidence: prediction.confidence,
        inference_ms: prediction.inference_ms,
    });
    if (predError) {
        logger_1.logger.warn("Failed to store prediction", { error: predError.message });
    }
    // 5. Evaluate and create alert if needed
    let alertTriggered = false;
    if (isLeak || (payload.anomaly_score ?? 0) >= 0.7) {
        await (0, alert_service_1.evaluateAndCreateAlert)({
            pipe_id: payload.pipe_id,
            zone_id: payload.zone_id,
            reading_id: reading.id,
            prediction,
            severity_pct: severityPct,
            frequency_hz: payload.frequency_hz,
            pressure_bar: payload.pressure_bar,
        });
        alertTriggered = true;
    }
    logger_1.logger.info("Reading processed", {
        pipe_id: payload.pipe_id,
        reading_id: reading.id,
        leak_class: prediction.leak_class,
        severity: severityPct,
        inference_ms: prediction.inference_ms,
    });
    return {
        reading_id: reading.id,
        prediction: {
            leak_class: prediction.leak_class,
            severity_estimate: prediction.severity_estimate,
            confidence: prediction.confidence,
            model_version: prediction.model_version,
        },
        alert_triggered: alertTriggered,
    };
}
async function processBatch(payloads, req) {
    const results = await Promise.allSettled(payloads.map(payload => processReading(payload, req)));
    return results.map((r, i) => {
        if (r.status === "fulfilled")
            return r.value;
        logger_1.logger.error("Batch item failed", {
            index: i,
            pipe_id: payloads[i].pipe_id,
            error: r.reason,
        });
        throw r.reason;
    });
}
//# sourceMappingURL=ingest.service.js.map