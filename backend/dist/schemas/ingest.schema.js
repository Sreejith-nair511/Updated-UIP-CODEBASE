"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchIngestSchema = exports.IngestPayloadSchema = void 0;
const zod_1 = require("zod");
exports.IngestPayloadSchema = zod_1.z.object({
    pipe_id: zod_1.z
        .string()
        .min(1)
        .max(20)
        .regex(/^P\d{3,4}$/, "pipe_id must match format P### (e.g. P101)"),
    zone_id: zod_1.z
        .string()
        .min(1)
        .max(10)
        .regex(/^Z\d+$/, "zone_id must match format Z# (e.g. Z1)"),
    reading_date: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "reading_date must be YYYY-MM-DD"),
    reading_time: zod_1.z
        .string()
        .regex(/^\d{2}:\d{2}(:\d{2})?$/, "reading_time must be HH:MM or HH:MM:SS"),
    pressure_bar: zod_1.z.number().min(0).max(20),
    flow_lpm: zod_1.z.number().min(0).max(1000),
    frequency_hz: zod_1.z.number().min(0).max(500),
    temp_c: zod_1.z.number().min(-10).max(80),
    humidity_pct: zod_1.z.number().min(0).max(100),
    valve_status: zod_1.z.enum(["OPEN", "CLOSED"]),
    // Optional: edge-computed fields
    anomaly_score: zod_1.z.number().min(0).max(1).optional(),
    dominant_frequency: zod_1.z.number().min(0).optional(),
    frequency_distribution: zod_1.z.record(zod_1.z.number()).optional(),
});
exports.BatchIngestSchema = zod_1.z.object({
    readings: zod_1.z.array(exports.IngestPayloadSchema).min(1).max(100),
});
//# sourceMappingURL=ingest.schema.js.map