"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const backend_1 = require("@clerk/backend");
const config_1 = require("../config");
const logger_1 = require("../lib/logger");
const crypto_1 = __importDefault(require("crypto"));
const clerk = (0, backend_1.createClerkClient)({ secretKey: config_1.config.clerk.secretKey });
// Hash the device API key for secure comparison
function hashApiKey(key) {
    return crypto_1.default.createHash('sha256').update(key).digest('hex');
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
async function requireAuth(req, res, next) {
    // Allow ESP32 devices with a static API key (secure comparison)
    const deviceKey = req.headers["x-api-key"];
    if (deviceKey && DEVICE_API_KEY_HASH) {
        const providedKeyHash = hashApiKey(deviceKey);
        if (crypto_1.default.timingSafeEqual(Buffer.from(providedKeyHash, 'hex'), Buffer.from(DEVICE_API_KEY_HASH, 'hex'))) {
            req.userId = "device";
            return next();
        }
    }
    // Require Clerk authentication in all environments
    // Allow bypass in development when no real Clerk key is set
    const hasRealClerkKey = config_1.config.clerk.secretKey &&
        !config_1.config.clerk.secretKey.includes("your_clerk") &&
        !config_1.config.clerk.secretKey.includes("demo_key") &&
        !config_1.config.clerk.secretKey.includes("sk_test_your");
    if (!hasRealClerkKey) {
        if (config_1.config.nodeEnv === "development") {
            req.userId = "dev-user";
            return next();
        }
        logger_1.logger.error("CLERK_SECRET_KEY not configured");
        return res.status(500).json({ error: "Authentication not configured" });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing authorization token" });
    }
    const token = authHeader.slice(7);
    try {
        const { verifyToken } = require("@clerk/backend");
        const { sub } = await verifyToken(token, { secretKey: config_1.config.clerk.secretKey });
        req.userId = sub;
        next();
    }
    catch (err) {
        logger_1.logger.warn("Auth token verification failed", {
            error: err instanceof Error ? err.message : String(err),
        });
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
//# sourceMappingURL=auth.middleware.js.map