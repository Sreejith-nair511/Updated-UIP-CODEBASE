import { Router, Request, Response, NextFunction } from "express";
import { IngestPayloadSchema, BatchIngestSchema } from "../schemas/ingest.schema";
import { processReading, processBatch } from "../services/ingest.service";
import { requireAuth } from "../middleware/auth.middleware";
import { logger } from "../lib/logger";

export const ingestRouter = Router();

// All ingest routes require auth (Clerk token or device API key)
ingestRouter.use(requireAuth as any);

/**
 * POST /ingest
 * Single reading ingestion from ESP32/edge device
 */
ingestRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = IngestPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await processReading(parsed.data, req);

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /ingest/batch
 * Batch ingestion (up to 100 readings)
 */
ingestRouter.post("/batch", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = BatchIngestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const results = await processBatch(parsed.data.readings, req);

    return res.status(201).json({
      success: true,
      processed: results.length,
      data: results,
    });
  } catch (err) {
    next(err);
  }
});
