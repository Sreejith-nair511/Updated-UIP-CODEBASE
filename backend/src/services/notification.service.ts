/**
 * notification.service.ts
 * Sends Web Push notifications to subscribed users when alerts are created.
 * Uses the Web Push Protocol (RFC 8030) via the `web-push` library.
 *
 * Setup:
 *   1. Generate VAPID keys once: npx web-push generate-vapid-keys
 *   2. Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT in .env
 *   3. Frontend subscribes via navigator.serviceWorker + pushManager.subscribe
 *      and POSTs the subscription to /api/push/subscribe
 */

import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";

// Lazy-load web-push so the service starts even if the package isn't installed
let webpush: typeof import("web-push") | null = null;
try {
  webpush = require("web-push");
  const vapidPublic  = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";
  if (vapidPublic && vapidPrivate && webpush) {
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
    logger.info("Web Push VAPID keys configured");
  } else {
    logger.warn("VAPID keys not set — push notifications disabled");
    webpush = null;
  }
} catch {
  logger.warn("web-push not installed — push notifications disabled");
}

export interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
}

/**
 * Send a push notification to all users who have notifications enabled
 * and have a stored push_token (Web Push subscription JSON).
 */
export async function sendAlertNotification(payload: PushPayload): Promise<void> {
  if (!webpush) return;

  const { data: users, error } = await supabase
    .from("users")
    .select("id, push_token")
    .eq("notifications_enabled", true)
    .not("push_token", "is", null);

  if (error || !users?.length) return;

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    tag: payload.tag ?? "leak-alert",
    url: payload.url ?? "/alerts",
    timestamp: Date.now(),
  });

  const results = await Promise.allSettled(
    users.map(async (user) => {
      try {
        const subscription = JSON.parse(user.push_token!);
        await webpush!.sendNotification(subscription, notification);
        logger.debug("Push sent", { userId: user.id });
      } catch (err: any) {
        // 410 Gone = subscription expired — clear it
        if (err?.statusCode === 410) {
          await supabase
            .from("users")
            .update({ push_token: null })
            .eq("id", user.id);
          logger.info("Cleared expired push subscription", { userId: user.id });
        } else {
          logger.warn("Push send failed", { userId: user.id, error: err?.message });
        }
      }
    })
  );

  const sent   = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  if (sent > 0) logger.info(`Push notifications sent: ${sent} ok, ${failed} failed`);
}
