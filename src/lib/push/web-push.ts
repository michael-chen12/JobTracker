import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/server';

// Configure VAPID details (only once at module load)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@jobtracker.app';

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[push] VAPID keys not configured — push notifications disabled');
    return false;
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  vapidConfigured = true;
  return true;
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: { url?: string };
}

/**
 * Send push notification to all subscribed devices for a user.
 * Auto-deletes stale subscriptions on 410/404 errors.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureVapidConfigured()) return;

  try {
    const adminClient = createAdminClient();

    // Fetch all push subscriptions for this user
    const { data: subscriptions, error } = await adminClient
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', userId);

    if (error || !subscriptions?.length) return;

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/badge-72x72.png',
      data: payload.data || {},
    });

    // Send to all subscriptions in parallel
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            notificationPayload
          );

          // Update last_used_at on successful send
          await adminClient
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', sub.id);
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          // 410 Gone or 404 Not Found = subscription expired, delete it
          if (statusCode === 410 || statusCode === 404) {
            console.info(`[push] Removing stale subscription ${sub.id}`);
            await adminClient
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id);
          } else {
            console.error(`[push] Failed to send to ${sub.id}:`, err);
          }
        }
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    if (successCount > 0) {
      console.info(`[push] Sent to ${successCount}/${subscriptions.length} devices for user ${userId}`);
    }
  } catch (error) {
    console.error('[push] sendPushToUser failed:', error);
  }
}
