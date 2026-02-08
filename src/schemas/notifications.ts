import { z } from 'zod';

// Notification type enum (matches DB CHECK constraint)
export const notificationTypeSchema = z.enum([
  'deadline',
  'follow_up',
  'interview',
  'offer',
  'general',
  'achievement',
  'weekly_digest',
]);

// Update notification preferences (all fields optional for partial updates)
export const updateNotificationPreferencesSchema = z.object({
  // In-app
  in_app_follow_up: z.boolean().optional(),
  in_app_deadline: z.boolean().optional(),
  in_app_interview: z.boolean().optional(),
  in_app_offer: z.boolean().optional(),
  in_app_achievement: z.boolean().optional(),
  in_app_general: z.boolean().optional(),
  // Email
  email_follow_up: z.boolean().optional(),
  email_deadline: z.boolean().optional(),
  email_interview: z.boolean().optional(),
  email_offer: z.boolean().optional(),
  email_weekly_digest: z.boolean().optional(),
  // Push
  push_follow_up: z.boolean().optional(),
  push_deadline: z.boolean().optional(),
  push_interview: z.boolean().optional(),
  push_offer: z.boolean().optional(),
});

// Register a push subscription
export const registerPushSubscriptionSchema = z.object({
  endpoint: z.string().url('Invalid push endpoint URL'),
  p256dh: z.string().min(1, 'p256dh key is required'),
  auth: z.string().min(1, 'Auth key is required'),
  user_agent: z.string().max(500).optional(),
});

// Batch mark notifications as read (max 100 to prevent abuse)
export const markNotificationsReadSchema = z.object({
  notification_ids: z
    .array(z.string().uuid('Invalid notification ID'))
    .min(1, 'At least one notification ID required')
    .max(100, 'Maximum 100 notifications per batch'),
});

// Notification filter for listing
export const notificationFilterSchema = z
  .enum([
    'all',
    'unread',
    'follow_up',
    'interview',
    'offer',
    'achievement',
    'deadline',
    'weekly_digest',
  ])
  .default('all');

// Unsubscribe token payload (used for email one-click unsubscribe)
export const unsubscribeTokenPayloadSchema = z.object({
  user_id: z.string().uuid(),
  type: z.enum([
    'email_follow_up',
    'email_deadline',
    'email_interview',
    'email_offer',
    'email_weekly_digest',
  ]),
  exp: z.number(), // Unix timestamp expiry
});

// Inferred types
export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;
export type RegisterPushSubscriptionInput = z.infer<typeof registerPushSubscriptionSchema>;
export type MarkNotificationsReadInput = z.infer<typeof markNotificationsReadSchema>;
export type NotificationFilter = z.infer<typeof notificationFilterSchema>;
export type UnsubscribeTokenPayload = z.infer<typeof unsubscribeTokenPayloadSchema>;
