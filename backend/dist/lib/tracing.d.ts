/**
 * Request tracing middleware for correlating requests across services
 */
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            traceId?: string;
            startTime?: number;
        }
    }
}
export declare function tracingMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function createTraceHeaders(traceId?: string): Record<string, string>;
export declare function extractTraceId(req: Request): string;
//# sourceMappingURL=tracing.d.ts.map