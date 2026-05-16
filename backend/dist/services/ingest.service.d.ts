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
export declare function processReading(payload: IngestPayload, req?: Request): Promise<IngestResult>;
export declare function processBatch(payloads: IngestPayload[], req?: Request): Promise<IngestResult[]>;
//# sourceMappingURL=ingest.service.d.ts.map