import { z } from "zod";
export declare const IngestPayloadSchema: z.ZodObject<{
    pipe_id: z.ZodString;
    zone_id: z.ZodString;
    reading_date: z.ZodString;
    reading_time: z.ZodString;
    pressure_bar: z.ZodNumber;
    flow_lpm: z.ZodNumber;
    frequency_hz: z.ZodNumber;
    temp_c: z.ZodNumber;
    humidity_pct: z.ZodNumber;
    valve_status: z.ZodEnum<["OPEN", "CLOSED"]>;
    anomaly_score: z.ZodOptional<z.ZodNumber>;
    dominant_frequency: z.ZodOptional<z.ZodNumber>;
    frequency_distribution: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    pipe_id: string;
    zone_id: string;
    reading_date: string;
    reading_time: string;
    pressure_bar: number;
    flow_lpm: number;
    frequency_hz: number;
    temp_c: number;
    humidity_pct: number;
    valve_status: "OPEN" | "CLOSED";
    anomaly_score?: number | undefined;
    dominant_frequency?: number | undefined;
    frequency_distribution?: Record<string, number> | undefined;
}, {
    pipe_id: string;
    zone_id: string;
    reading_date: string;
    reading_time: string;
    pressure_bar: number;
    flow_lpm: number;
    frequency_hz: number;
    temp_c: number;
    humidity_pct: number;
    valve_status: "OPEN" | "CLOSED";
    anomaly_score?: number | undefined;
    dominant_frequency?: number | undefined;
    frequency_distribution?: Record<string, number> | undefined;
}>;
export type IngestPayload = z.infer<typeof IngestPayloadSchema>;
export declare const BatchIngestSchema: z.ZodObject<{
    readings: z.ZodArray<z.ZodObject<{
        pipe_id: z.ZodString;
        zone_id: z.ZodString;
        reading_date: z.ZodString;
        reading_time: z.ZodString;
        pressure_bar: z.ZodNumber;
        flow_lpm: z.ZodNumber;
        frequency_hz: z.ZodNumber;
        temp_c: z.ZodNumber;
        humidity_pct: z.ZodNumber;
        valve_status: z.ZodEnum<["OPEN", "CLOSED"]>;
        anomaly_score: z.ZodOptional<z.ZodNumber>;
        dominant_frequency: z.ZodOptional<z.ZodNumber>;
        frequency_distribution: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        pipe_id: string;
        zone_id: string;
        reading_date: string;
        reading_time: string;
        pressure_bar: number;
        flow_lpm: number;
        frequency_hz: number;
        temp_c: number;
        humidity_pct: number;
        valve_status: "OPEN" | "CLOSED";
        anomaly_score?: number | undefined;
        dominant_frequency?: number | undefined;
        frequency_distribution?: Record<string, number> | undefined;
    }, {
        pipe_id: string;
        zone_id: string;
        reading_date: string;
        reading_time: string;
        pressure_bar: number;
        flow_lpm: number;
        frequency_hz: number;
        temp_c: number;
        humidity_pct: number;
        valve_status: "OPEN" | "CLOSED";
        anomaly_score?: number | undefined;
        dominant_frequency?: number | undefined;
        frequency_distribution?: Record<string, number> | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    readings: {
        pipe_id: string;
        zone_id: string;
        reading_date: string;
        reading_time: string;
        pressure_bar: number;
        flow_lpm: number;
        frequency_hz: number;
        temp_c: number;
        humidity_pct: number;
        valve_status: "OPEN" | "CLOSED";
        anomaly_score?: number | undefined;
        dominant_frequency?: number | undefined;
        frequency_distribution?: Record<string, number> | undefined;
    }[];
}, {
    readings: {
        pipe_id: string;
        zone_id: string;
        reading_date: string;
        reading_time: string;
        pressure_bar: number;
        flow_lpm: number;
        frequency_hz: number;
        temp_c: number;
        humidity_pct: number;
        valve_status: "OPEN" | "CLOSED";
        anomaly_score?: number | undefined;
        dominant_frequency?: number | undefined;
        frequency_distribution?: Record<string, number> | undefined;
    }[];
}>;
export type BatchIngestPayload = z.infer<typeof BatchIngestSchema>;
//# sourceMappingURL=ingest.schema.d.ts.map