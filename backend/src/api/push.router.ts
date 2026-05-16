import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { requireAuth } from "../middleware/auth.middleware";
import { logger } from "../lib/logger";

export const pushRouter = Router();

const SubscribeSchema = z.object({
  userId: z.string().min(1),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
});

/**
 * POST /push/subscribe
 * Store a Web Push subscription for a user.
 */
pushRouter.post(
  "/subscribe",
  requireAuth as any,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = SubscribeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid subscription payload" });
      }

      const { userId, subscription } = parsed.data;

      const { error } = await supabase
        .from("users")
        .upsert(
          { id: userId, push_token: JSON.stringify(subscription), notifications_enabled: true },
          { onConflict: "id" }
        );

      if (error) {
        logger.error("Failed to store push subscription", { error: error.message });
        return res.status(500).json({ error: "Failed to store subscription" });
      }

      logger.info("Push subscription stored", { userId });
      return res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /push/subscribe
 * Remove a push subscription for a user.
 */
pushRouter.delete(
  "/subscribe",
  requireAuth as any,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      await supabase
        .from("users")
        .update({ push_token: null, notifications_enabled: false })
        .eq("id", userId);

      return res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /push/vapid-public-key
 * Return the VAPID public key so the frontend can subscribe.
 */
pushRouter.get("/vapid-public-key", (_req: Request, res: Response) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) return res.status(503).json({ error: "Push notifications not configured" });
  return res.json({ publicKey: key });
});
