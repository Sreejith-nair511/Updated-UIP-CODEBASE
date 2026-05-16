"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const config_1 = require("../config");
const logger_1 = require("../lib/logger");
exports.healthRouter = (0, express_1.Router)();
exports.healthRouter.get("/", async (_req, res) => {
    const checks = {};
    // Check Supabase connectivity
    try {
        const { error } = await supabase_1.supabase.from("pipes").select("id").limit(1);
        checks.database = error ? "error" : "ok";
    }
    catch {
        checks.database = "error";
    }
    // Check ML service
    try {
        const response = await fetch(`${config_1.config.ml.serviceUrl}/health`, {
            signal: AbortSignal.timeout(2000),
        });
        checks.ml_service = response.ok ? "ok" : "error";
    }
    catch {
        checks.ml_service = "error";
    }
    const allOk = Object.values(checks).every((v) => v === "ok");
    return res.status(allOk ? 200 : 503).json({
        status: allOk ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        checks,
    });
});
// Dedicated ML service health endpoint for frontend
exports.healthRouter.get("/ml", async (_req, res) => {
    try {
        const mlResponse = await fetch(`${config_1.config.ml.serviceUrl}/health`, {
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
    }
    catch (err) {
        logger_1.logger.error("ML service health check failed", { error: err });
        res.status(503).json({
            status: "unhealthy",
            error: err instanceof Error ? err.message : "ML service unavailable",
            timestamp: new Date().toISOString(),
        });
    }
});
// System metrics and performance monitoring
exports.healthRouter.get("/metrics", async (_req, res) => {
    try {
        const { getMLServiceStats } = await Promise.resolve().then(() => __importStar(require("../services/ml.service")));
        const { cache } = await Promise.resolve().then(() => __importStar(require("../lib/cache")));
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
    }
    catch (err) {
        logger_1.logger.error("Failed to collect metrics", { error: err });
        res.status(500).json({
            error: "Failed to collect metrics",
            timestamp: new Date().toISOString(),
        });
    }
});
//# sourceMappingURL=health.router.js.map