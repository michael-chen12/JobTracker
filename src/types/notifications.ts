// Notification System Types (Ticket #29)

// Extended notification type (adds achievement, weekly_digest to existing DB types)
export type ExtendedNotificationType =
  | 'deadline'
  | 'follow_up'
  | 'interview'
  | 'offer'
  | 'general'
  | 'achievement'
  | 'weekly_digest';

// Matches the extended notifications table schema
export interface NotificationRow {
  id: string;
  user_id: string;
  notification_type: ExtendedNotificationType;
  title: string;
  message: string;
  related_application_id: string | null;
  is_read: boolean;
  scheduled_for: string | null;
  action_url: string | null;
  email_sent: boolean;
  push_sent: boolean;
  created_at: string;
}

// Notification preferences (one row per user, granular per-type per-channel)
export interface NotificationPreferences {
  id: string;
  user_id: string;
  // In-app toggles (default true)
  in_app_follow_up: boolean;
  in_app_deadline: boolean;
  in_app_interview: boolean;
  in_app_offer: boolean;
  in_app_achievement: boolean;
  in_app_general: boolean;
  // Email toggles (default false = opt-in)
  email_follow_up: boolean;
  email_deadline: boolean;
  email_interview: boolean;
  email_offer: boolean;
  email_weekly_digest: boolean;
  // Push toggles (default false = opt-in)
  push_follow_up: boolean;
  push_deadline: boolean;
  push_interview: boolean;
  push_offer: boolean;
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Push subscription stored in DB
export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
  last_used_at: string;
}

// For UI dropdown grouping
export interface NotificationGroup {
  label: string; // "Today", "Yesterday", "This Week", "Older"
  notifications: NotificationRow[];
}

// Paginated notification response
export interface PaginatedNotifications {
  notifications: NotificationRow[];
  total: number;
  unreadCount: number;
}

// Create notification params (internal use)
export interface CreateNotificationParams {
  userId: string;
  type: ExtendedNotificationType;
  title: string;
  message: string;
  relatedApplicationId?: string;
  actionUrl?: string;
}

// Notification icon/label mapping for UI
export const NOTIFICATION_TYPE_CONFIG: Record<
  ExtendedNotificationType,
  { label: string; iconName: string }
> = {
  deadline: { label: 'Deadline', iconName: 'CalendarClock' },
  follow_up: { label: 'Follow-up', iconName: 'Clock' },
  interview: { label: 'Interview', iconName: 'Briefcase' },
  offer: { label: 'Offer', iconName: 'Gift' },
  general: { label: 'General', iconName: 'Bell' },
  achievement: { label: 'Achievement', iconName: 'Trophy' },
  weekly_digest: { label: 'Weekly Digest', iconName: 'BarChart3' },
};

// Preference key mapping helpers
export type InAppPreferenceKey = `in_app_${Exclude<ExtendedNotificationType, 'weekly_digest'>}`;
export type EmailPreferenceKey = `email_${Exclude<ExtendedNotificationType, 'general' | 'achievement'>}`;
export type PushPreferenceKey = `push_${Exclude<ExtendedNotificationType, 'general' | 'achievement' | 'weekly_digest'>}`;
