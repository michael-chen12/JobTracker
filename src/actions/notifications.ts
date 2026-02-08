'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  updateNotificationPreferencesSchema,
  registerPushSubscriptionSchema,
  markNotificationsReadSchema,
  notificationFilterSchema,
} from '@/schemas/notifications';
import type {
  NotificationRow,
  NotificationPreferences,
  PaginatedNotifications,
} from '@/types/notifications';
import type { NotificationFilter } from '@/schemas/notifications';

// --- Return types (discriminated unions) ---

type GetNotificationsResult =
  | { success: true; data: PaginatedNotifications }
  | { success: false; error: string };

type GetUnreadCountResult =
  | { success: true; data: { count: number } }
  | { success: false; error: string };

type MarkReadResult = { success: true } | { success: false; error: string };

type DeleteResult = { success: true } | { success: false; error: string };

type GetPreferencesResult =
  | { success: true; data: NotificationPreferences }
  | { success: false; error: string };

type UpdatePreferencesResult =
  | { success: true; data: NotificationPreferences }
  | { success: false; error: string };

type PushSubscriptionResult = { success: true } | { success: false; error: string };

// --- Helper: Get authenticated user ---

async function getAuthenticatedUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return { authUser: null, dbUser: null };
  }

  const { data: dbUser, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .eq('auth_id', authUser.id)
    .single();

  if (userError || !dbUser) {
    return { authUser, dbUser: null };
  }

  return { authUser, dbUser };
}

// --- 1. Get Notifications (paginated) ---

export async function getNotifications(
  limit: number = 20,
  offset: number = 0,
  filter: string = 'all'
): Promise<GetNotificationsResult> {
  try {
    const supabase = await createClient();
    const { dbUser } = await getAuthenticatedUser(supabase);

    if (!dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const parsedFilter = notificationFilterSchema.safeParse(filter);
    const activeFilter: NotificationFilter = parsedFilter.success ? parsedFilter.data : 'all';

    // Build query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', dbUser.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filter
    if (activeFilter === 'unread') {
      query = query.eq('is_read', false);
    } else if (activeFilter !== 'all') {
      query = query.eq('notification_type', activeFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return { success: false, error: 'Failed to load notifications' };
    }

    // Get unread count separately (uses partial index)
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', dbUser.id)
      .eq('is_read', false);

    return {
      success: true,
      data: {
        notifications: (data ?? []) as NotificationRow[],
        total: count ?? 0,
        unreadCount: unreadCount ?? 0,
      },
    };
  } catch (error) {
    console.error('Exception in getNotifications:', error);
    return { success: false, error: 'Failed to load notifications' };
  }
}

// --- 2. Get Unread Count ---

export async function getUnreadCount(): Promise<GetUnreadCountResult> {
  try {
    const supabase = await createClient();
    const { dbUser } = await getAuthenticatedUser(supabase);

    if (!dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', dbUser.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return { success: false, error: 'Failed to get unread count' };
    }

    return { success: true, data: { count: count ?? 0 } };
  } catch (error) {
    console.error('Exception in getUnreadCount:', error);
    return { success: false, error: 'Failed to get unread count' };
  }
}

// --- 3. Mark Notifications Read (batch) ---

export async function markNotificationsRead(input: unknown): Promise<MarkReadResult> {
  try {
    const supabase = await createClient();
    const { dbUser } = await getAuthenticatedUser(supabase);

    if (!dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const parsed = markNotificationsReadSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' };
    }

    // Update with IDOR protection (user_id filter)
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', parsed.data.notification_ids)
      .eq('user_id', dbUser.id);

    if (error) {
      console.error('Error marking notifications read:', error);
      return { success: false, error: 'Failed to mark notifications as read' };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Exception in markNotificationsRead:', error);
    return { success: false, error: 'Failed to mark notifications as read' };
  }
}

// --- 4. Mark All Notifications Read ---

export async function markAllNotificationsRead(): Promise<MarkReadResult> {
  try {
    const supabase = await createClient();
    const { dbUser } = await getAuthenticatedUser(supabase);

    if (!dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', dbUser.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications read:', error);
      return { success: false, error: 'Failed to mark all as read' };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Exception in markAllNotificationsRead:', error);
    return { success: false, error: 'Failed to mark all as read' };
  }
}

// --- 5. Delete Notification ---

export async function deleteNotification(notificationId: string): Promise<DeleteResult> {
  try {
    const supabase = await createClient();
    const { dbUser } = await getAuthenticatedUser(supabase);

    if (!dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // IDOR protection: user_id filter
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', dbUser.id);

    if (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: 'Failed to delete notification' };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Exception in deleteNotification:', error);
    return { success: false, error: 'Failed to delete notification' };
  }
}

// --- 6. Get Notification Preferences ---

export async function getNotificationPreferences(): Promise<GetPreferencesResult> {
  try {
    const supabase = await createClient();
    const { dbUser } = await getAuthenticatedUser(supabase);

    if (!dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Try to fetch existing preferences
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', dbUser.id)
      .single();

    if (data) {
      return { success: true, data: data as NotificationPreferences };
    }

    // If no row exists, create default preferences via admin client
    if (error?.code === 'PGRST116') {
      const adminClient = createAdminClient();
      const { data: newPrefs, error: insertError } = await adminClient
        .from('notification_preferences')
        .insert({ user_id: dbUser.id })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating default preferences:', insertError);
        return { success: false, error: 'Failed to create notification preferences' };
      }

      return { success: true, data: newPrefs as NotificationPreferences };
    }

    console.error('Error fetching preferences:', error);
    return { success: false, error: 'Failed to load notification preferences' };
  } catch (error) {
    console.error('Exception in getNotificationPreferences:', error);
    return { success: false, error: 'Failed to load notification preferences' };
  }
}

// --- 7. Update Notification Preferences ---

export async function updateNotificationPreferences(
  input: unknown
): Promise<UpdatePreferencesResult> {
  try {
    const supabase = await createClient();
    const { dbUser } = await getAuthenticatedUser(supabase);

    if (!dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const parsed = updateNotificationPreferencesSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' };
    }

    // Ensure preferences row exists first
    const prefsResult = await getNotificationPreferences();
    if (!prefsResult.success) {
      return { success: false, error: 'Failed to load preferences' };
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .update(parsed.data)
      .eq('user_id', dbUser.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      return { success: false, error: 'Failed to update preferences' };
    }

    revalidatePath('/dashboard/profile');
    return { success: true, data: data as NotificationPreferences };
  } catch (error) {
    console.error('Exception in updateNotificationPreferences:', error);
    return { success: false, error: 'Failed to update preferences' };
  }
}

// --- 8. Register Push Subscription ---

export async function registerPushSubscription(
  input: unknown
): Promise<PushSubscriptionResult> {
  try {
    const supabase = await createClient();
    const { dbUser } = await getAuthenticatedUser(supabase);

    if (!dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const parsed = registerPushSubscriptionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' };
    }

    // Upsert: if same user+endpoint exists, update the keys
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: dbUser.id,
          endpoint: parsed.data.endpoint,
          p256dh: parsed.data.p256dh,
          auth: parsed.data.auth,
          user_agent: parsed.data.user_agent ?? null,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,endpoint' }
      );

    if (error) {
      console.error('Error registering push subscription:', error);
      return { success: false, error: 'Failed to register push subscription' };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception in registerPushSubscription:', error);
    return { success: false, error: 'Failed to register push subscription' };
  }
}

// --- 9. Unregister Push Subscription ---

export async function unregisterPushSubscription(
  endpoint: string
): Promise<PushSubscriptionResult> {
  try {
    const supabase = await createClient();
    const { dbUser } = await getAuthenticatedUser(supabase);

    if (!dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!endpoint || typeof endpoint !== 'string') {
      return { success: false, error: 'Invalid endpoint' };
    }

    // IDOR protection: user_id filter
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('user_id', dbUser.id);

    if (error) {
      console.error('Error unregistering push subscription:', error);
      return { success: false, error: 'Failed to unregister push subscription' };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception in unregisterPushSubscription:', error);
    return { success: false, error: 'Failed to unregister push subscription' };
  }
}

// --- 10. Create System Notification (internal, uses admin client) ---

export async function createSystemNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedApplicationId?: string;
  actionUrl?: string;
}): Promise<{ success: true; data: NotificationRow } | { success: false; error: string }> {
  try {
    const adminClient = createAdminClient();

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
      console.error('Error creating system notification:', error);
      return { success: false, error: 'Failed to create notification' };
    }

    return { success: true, data: data as NotificationRow };
  } catch (error) {
    console.error('Exception in createSystemNotification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}
