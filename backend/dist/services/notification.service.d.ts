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
export declare function sendAlertNotification(payload: PushPayload): Promise<void>;
//# sourceMappingURL=notification.service.d.ts.map