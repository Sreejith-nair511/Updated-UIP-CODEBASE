import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";
import { runMLInference } from "./ml.service";
import { evaluateAndCreateAlert } from "./alert.service";
import { extractTraceId } from "../lib/tracing";
import type { IngestPayload } from "../schemas/ingest.schema";
import type { Request } from "express";

export interface IngestResult {
  reading_id: string;
  prediction: {
    leak_class: string;
    severity_estimate: number;
    confidence: number;
    model_version: string;
  };
  alert_triggered: boolean;
}

export async function processReading(payload: IngestPayload, req?: Request): Promise<IngestResult> {
  const traceId = req ? extractTraceId(req) : undefined;
  
  logger.info("Processing reading", { 
    traceId,
    pipe_id: payload.pipe_id, 
    zone_id: payload.zone_id 
  });

  // 1. Validate pipe exists
  const { data: pipeExists, error: pipeError } = await supabase
    .from("pipes")
    .select("id")
    .eq("pipe_id", payload.pipe_id)
    .eq("zone_id", payload.zone_id)
    .single();

  if (pipeError || !pipeExists) {
    logger.error("Invalid pipe_id or zone_id", { 
      traceId,
      pipe_id: payload.pipe_id, 
      zone_id: payload.zone_id,
      error: pipeError?.message 
    });
    throw new Error(`Pipe ${payload.pipe_id} not found in zone ${payload.zone_id}`);
  }

  // 2. Run ML inference
  const prediction = await runMLInference({
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
  const { data: reading, error: readingError } = await supabase
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
    logger.error("Failed to store reading", { 
      traceId,
      error: readingError?.message 
    });
    throw new Error(`Failed to store reading: ${readingError?.message}`);
  }

  logger.debug("Reading stored successfully", { 
    traceId,
    reading_id: reading.id,
    leak_detected: isLeak 
  });

  // 5. Store prediction
  const { error: predError } = await supabase.from("predictions").insert({
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
    logger.warn("Failed to store prediction", { error: predError.message });
  }

  // 5. Evaluate and create alert if needed
  let alertTriggered = false;
  if (isLeak || (payload.anomaly_score ?? 0) >= 0.7) {
    await evaluateAndCreateAlert({
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

  logger.info("Reading processed", {
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

export async function processBatch(payloads: IngestPayload[], req?: Request): Promise<IngestResult[]> {
  const results = await Promise.allSettled(
    payloads.map(payload => processReading(payload, req))
  );

  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    logger.error("Batch item failed", {
      index: i,
      pipe_id: payloads[i].pipe_id,
      error: r.reason,
    });
    throw r.reason;
  });
}
