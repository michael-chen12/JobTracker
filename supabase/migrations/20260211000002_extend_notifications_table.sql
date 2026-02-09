-- Extend notifications table with tracking columns and new notification types
-- Used by: src/actions/notifications.ts, src/lib/notifications/trigger.ts

-- Add tracking columns for email and push delivery status
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email_sent BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS push_sent BOOLEAN NOT NULL DEFAULT false;

-- Drop existing CHECK constraint on notification_type
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

-- Add updated CHECK constraint to include new types: 'achievement', 'weekly_digest'
ALTER TABLE notifications ADD CONSTRAINT notifications_notification_type_check
  CHECK (notification_type IN (
    'deadline',
    'follow_up',
    'interview',
    'offer',
    'general',
    'achievement',
    'weekly_digest'
  ));

-- Comment: These columns enable:
-- - action_url: Deep linking to relevant app pages when clicking notifications
-- - email_sent: Prevents duplicate emails, tracks delivery status
-- - push_sent: Prevents duplicate push, tracks delivery status
-- - achievement/weekly_digest: New notification types for Wins page and digests
