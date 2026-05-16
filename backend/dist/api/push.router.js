"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const supabase_1 = require("../lib/supabase");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = require("../lib/logger");
exports.pushRouter = (0, express_1.Router)();
const SubscribeSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    subscription: zod_1.z.object({
        endpoint: zod_1.z.string().url(),
        keys: zod_1.z.object({
            p256dh: zod_1.z.string(),
            auth: zod_1.z.string(),
        }),
    }),
});
/**
 * POST /push/subscribe
 * Store a Web Push subscription for a user.
 */
exports.pushRouter.post("/subscribe", auth_middleware_1.requireAuth, async (req, res, next) => {
    try {
        const parsed = SubscribeSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid subscription payload" });
        }
        const { userId, subscription } = parsed.data;
        const { error } = await supabase_1.supabase
            .from("users")
            .upsert({ id: userId, push_token: JSON.stringify(subscription), notifications_enabled: true }, { onConflict: "id" });
        if (error) {
            logger_1.logger.error("Failed to store push subscription", { error: error.message });
            return res.status(500).json({ error: "Failed to store subscription" });
        }
        logger_1.logger.info("Push subscription stored", { userId });
        return res.status(200).json({ success: true });
    }
    catch (err) {
        next(err);
    }
});
/**
 * DELETE /push/subscribe
 * Remove a push subscription for a user.
 */
exports.pushRouter.delete("/subscribe", auth_middleware_1.requireAuth, async (req, res, next) => {
    try {
        const userId = req.userId;
        await supabase_1.supabase
            .from("users")
            .update({ push_token: null, notifications_enabled: false })
            .eq("id", userId);
        return res.status(200).json({ success: true });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /push/vapid-public-key
 * Return the VAPID public key so the frontend can subscribe.
 */
exports.pushRouter.get("/vapid-public-key", (_req, res) => {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key)
        return res.status(503).json({ error: "Push notifications not configured" });
    return res.json({ publicKey: key });
});
//# sourceMappingURL=push.router.js.map