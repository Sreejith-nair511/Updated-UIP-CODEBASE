import { Request, Response, NextFunction } from "express";
import { createClerkClient } from "@clerk/backend";
import { config } from "../config";
import { logger } from "../lib/logger";
import crypto from "crypto";

const clerk = createClerkClient({ secretKey: config.clerk.secretKey });

// Hash the device API key for secure comparison
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Store hashed version of device API key
const DEVICE_API_KEY_HASH = process.env.DEVICE_API_KEY 
  ? hashApiKey(process.env.DEVICE_API_KEY)
  : null;

/**
 * Verify Clerk session token from Authorization header.
 * Attaches userId to req for downstream use.
 *
 * For ESP32 devices: use a long-lived API key instead of Clerk tokens.
 * Pass it as X-API-Key header — validated against DEVICE_API_KEY env var.
 */
export async function requireAuth(
  req: Request & { userId?: string },
  res: Response,
  next: NextFunction
) {
  // Allow ESP32 devices with a static API key (secure comparison)
  const deviceKey = req.headers["x-api-key"];
  if (deviceKey && DEVICE_API_KEY_HASH) {
    const providedKeyHash = hashApiKey(deviceKey as string);
    if (crypto.timingSafeEqual(
      Buffer.from(providedKeyHash, 'hex'),
      Buffer.from(DEVICE_API_KEY_HASH, 'hex')
    )) {
      req.userId = "device";
      return next();
    }
  }

  // Require Clerk authentication in all environments
  // Allow bypass in development when no real Clerk key is set
  const hasRealClerkKey =
    config.clerk.secretKey &&
    !config.clerk.secretKey.includes("your_clerk") &&
    !config.clerk.secretKey.includes("demo_key") &&
    !config.clerk.secretKey.includes("sk_test_your");

  if (!hasRealClerkKey) {
    if (config.nodeEnv === "development") {
      req.userId = "dev-user";
      return next();
    }
    logger.error("CLERK_SECRET_KEY not configured");
    return res.status(500).json({ error: "Authentication not configured" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const token = authHeader.slice(7);

  try {
    const { verifyToken } = require("@clerk/backend");
    const { sub } = await verifyToken(token, { secretKey: config.clerk.secretKey });
    req.userId = sub;
    next();
  } catch (err) {
    logger.warn("Auth token verification failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
