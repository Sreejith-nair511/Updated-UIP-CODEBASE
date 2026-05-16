"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestRouter = void 0;
const express_1 = require("express");
const ingest_schema_1 = require("../schemas/ingest.schema");
const ingest_service_1 = require("../services/ingest.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
exports.ingestRouter = (0, express_1.Router)();
// All ingest routes require auth (Clerk token or device API key)
exports.ingestRouter.use(auth_middleware_1.requireAuth);
/**
 * POST /ingest
 * Single reading ingestion from ESP32/edge device
 */
exports.ingestRouter.post("/", async (req, res, next) => {
    try {
        const parsed = ingest_schema_1.IngestPayloadSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: parsed.error.flatten().fieldErrors,
            });
        }
        const result = await (0, ingest_service_1.processReading)(parsed.data, req);
        return res.status(201).json({
            success: true,
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /ingest/batch
 * Batch ingestion (up to 100 readings)
 */
exports.ingestRouter.post("/batch", async (req, res, next) => {
    try {
        const parsed = ingest_schema_1.BatchIngestSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: parsed.error.flatten().fieldErrors,
            });
        }
        const results = await (0, ingest_service_1.processBatch)(parsed.data.readings, req);
        return res.status(201).json({
            success: true,
            processed: results.length,
            data: results,
        });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=ingest.router.js.map