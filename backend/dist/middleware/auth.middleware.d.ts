import { Request, Response, NextFunction } from "express";
/**
 * Verify Clerk session token from Authorization header.
 * Attaches userId to req for downstream use.
 *
 * For ESP32 devices: use a long-lived API key instead of Clerk tokens.
 * Pass it as X-API-Key header — validated against DEVICE_API_KEY env var.
 */
export declare function requireAuth(req: Request & {
    userId?: string;
}, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=auth.middleware.d.ts.map