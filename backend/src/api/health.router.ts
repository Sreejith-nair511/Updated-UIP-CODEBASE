import { Router } from "express";
import { supabase } from "../lib/supabase";
import { config } from "../config";
import { logger } from "../lib/logger";
import { getMQTTStatus } from "../lib/mqtt";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  const checks: Record<string, "ok" | "error"> = {};

  // Check Supabase connectivity
  try {
    const { error } = await supabase.from("pipes").select("id").limit(1);
    checks.database = error ? "error" : "ok";
  } catch {
    checks.database = "error";
  }

  // Check ML service
  try {
    const response = await fetch(`${config.ml.serviceUrl}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    checks.ml_service = response.ok ? "ok" : "error";
  } catch {
    checks.ml_service = "error";
  }

  // Check MQTT
  const mqttStatus = getMQTTStatus();
  checks.mqtt = mqttStatus.connected ? "ok" : "error";

  const allOk = Object.values(checks).every((v) => v === "ok");

  return res.status(allOk ? 200 : 503).json({
    status: allOk ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    checks,
    mqtt: mqttStatus,
  });
});

// Dedicated ML service health endpoint for frontend
healthRouter.get("/ml", async (_req, res) => {
  try {
    const mlResponse = await fetch(`${config.ml.serviceUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    
    if (!mlResponse.ok) {
      throw new Error(`ML service returned ${mlResponse.status}`);
    }
    
    const mlData = await mlResponse.json();
    res.json({
      status: "healthy",
      ml_service: mlData,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error("ML service health check failed", { error: err });
    res.status(503).json({
      status: "unhealthy",
      error: err instanceof Error ? err.message : "ML service unavailable",
      timestamp: new Date().toISOString(),
    });
  }
});

// System metrics and performance monitoring
healthRouter.get("/metrics", async (_req, res) => {
  try {
    const { getMLServiceStats } = await import("../services/ml.service");
    const { cache } = await import("../lib/cache");
    
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      ml_service: getMLServiceStats(),
      cache: {
        size: cache.size(),
      },
      system: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    res.json(metrics);
  } catch (err) {
    logger.error("Failed to collect metrics", { error: err });
    res.status(500).json({
      error: "Failed to collect metrics",
      timestamp: new Date().toISOString(),
    });
  }
});
