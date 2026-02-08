import { createAdminClient } from '@/lib/supabase/server';
import { sendNotificationEmail } from '@/lib/email/sender';
import { sendPushToUser } from '@/lib/push/web-push';
import type { CreateNotificationParams, ExtendedNotificationType, NotificationRow } from '@/types/notifications';

/**
 * Map notification type to the corresponding preference column names
 */
function getPreferenceKeys(type: ExtendedNotificationType): {
  inApp: string | null;
  email: string | null;
  push: string | null;
} {
  const typeMap: Record<ExtendedNotificationType, { inApp: string | null; email: string | null; push: string | null }> = {
    follow_up: { inApp: 'in_app_follow_up', email: 'email_follow_up', push: 'push_follow_up' },
    deadline: { inApp: 'in_app_deadline', email: 'email_deadline', push: 'push_deadline' },
    interview: { inApp: 'in_app_interview', email: 'email_interview', push: 'push_interview' },
    offer: { inApp: 'in_app_offer', email: 'email_offer', push: 'push_offer' },
    achievement: { inApp: 'in_app_achievement', email: null, push: null },
    general: { inApp: 'in_app_general', email: null, push: null },
    weekly_digest: { inApp: null, email: 'email_weekly_digest', push: null },
  };
  return typeMap[type];
}

/**
 * Central notification trigger — called from server actions to create notifications
 * and dispatch to enabled channels (in-app, email, push).
 *
 * 1. Checks user notification preferences
 * 2. If in-app enabled: INSERT via admin client (bypasses RLS)
 * 3. If email enabled: fire-and-forget sendNotificationEmail()
 * 4. If push enabled: fire-and-forget sendPushToUser()
 */
export async function triggerNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const adminClient = createAdminClient();
    const prefKeys = getPreferenceKeys(params.type);

    // Fetch user preferences (or use defaults if no row exists)
    const { data: prefs } = await adminClient
      .from('notification_preferences')
      .select('*')
      .eq('user_id', params.userId)
      .single();

    // Default behavior: in-app enabled, email/push disabled (matches DB defaults)
    const inAppEnabled = prefKeys.inApp
      ? (prefs?.[prefKeys.inApp as keyof typeof prefs] as boolean) ?? true
      : params.type !== 'weekly_digest'; // weekly_digest has no in-app
    const emailEnabled = prefKeys.email
      ? (prefs?.[prefKeys.email as keyof typeof prefs] as boolean) ?? false
      : false;
    const pushEnabled = prefKeys.push
      ? (prefs?.[prefKeys.push as keyof typeof prefs] as boolean) ?? false
      : false;

    let notificationRow: NotificationRow | null = null;

    // 1. Create in-app notification
    if (inAppEnabled) {
      const { data, error } = await adminClient
        .from('notifications')
        .insert({
          user_id: params.userId,
          notification_type: params.type,
          title: params.title,
          message: params.message,
          related_application_id: params.relatedApplicationId ?? null,
          action_url: params.actionUrl ?? null,
          scheduled_for: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[trigger] Failed to create in-app notification:', error);
      } else {
        notificationRow = data as NotificationRow;
      }
    }

    // 2. Get user email for email notifications
    if (emailEnabled || pushEnabled) {
      const { data: user } = await adminClient
        .from('users')
        .select('email')
        .eq('id', params.userId)
        .single();

      const userEmail = user?.email;

      // Fire-and-forget email (non-blocking)
      if (emailEnabled && userEmail) {
        sendNotificationEmail({
          userId: params.userId,
          userEmail,
          notificationType: params.type,
          title: params.title,
          message: params.message,
          actionUrl: params.actionUrl,
          notificationId: notificationRow?.id,
        }).catch((err) => {
          console.error('[trigger] Email dispatch failed:', err);
        });
      }

      // Fire-and-forget push (non-blocking)
      if (pushEnabled) {
        sendPushToUser(params.userId, {
          title: params.title,
          body: params.message,
          data: { url: params.actionUrl ?? '/dashboard' },
        }).catch((err) => {
          console.error('[trigger] Push dispatch failed:', err);
        });
      }
    }
  } catch (error) {
    // Never throw from trigger — notifications should not break the main action
    console.error('[trigger] Notification trigger failed:', error);
  }
}
