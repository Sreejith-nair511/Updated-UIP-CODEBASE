import { z } from "zod";

export const IngestPayloadSchema = z.object({
  pipe_id: z
    .string()
    .min(1)
    .max(20)
    .regex(/^P\d{3,4}$/, "pipe_id must match format P### (e.g. P101)"),
  zone_id: z
    .string()
    .min(1)
    .max(10)
    .regex(/^Z\d+$/, "zone_id must match format Z# (e.g. Z1)"),
  reading_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "reading_date must be YYYY-MM-DD"),
  reading_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "reading_time must be HH:MM or HH:MM:SS"),
  pressure_bar: z.number().min(0).max(20),
  flow_lpm: z.number().min(0).max(1000),
  frequency_hz: z.number().min(0).max(500),
  temp_c: z.number().min(-10).max(80),
  humidity_pct: z.number().min(0).max(100),
  valve_status: z.enum(["OPEN", "CLOSED"]),
  // Optional: edge-computed fields
  anomaly_score: z.number().min(0).max(1).optional(),
  dominant_frequency: z.number().min(0).optional(),
  frequency_distribution: z.record(z.number()).optional(),
});

export type IngestPayload = z.infer<typeof IngestPayloadSchema>;

export const BatchIngestSchema = z.object({
  readings: z.array(IngestPayloadSchema).min(1).max(100),
});

export type BatchIngestPayload = z.infer<typeof BatchIngestSchema>;
