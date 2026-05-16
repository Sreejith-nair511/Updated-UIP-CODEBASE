import type { MLPrediction } from "./ml.service";
interface AlertInput {
    pipe_id: string;
    zone_id: string;
    reading_id: string;
    prediction: MLPrediction;
    severity_pct: number;
    frequency_hz: number;
    pressure_bar: number;
}
export declare function evaluateAndCreateAlert(input: AlertInput): Promise<void>;
export {};
//# sourceMappingURL=alert.service.d.ts.map