-- Add indexes to notifications table for query performance
-- Used by: src/actions/notifications.ts for filtering and sorting

-- Index for ordering notifications by creation time (newest first)
CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications(created_at DESC);

-- Index for scheduled notifications (used by cron jobs to find pending notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for
  ON notifications(scheduled_for)
  WHERE scheduled_for IS NOT NULL;

-- Composite index for filtered queries (e.g., "show unread interview notifications")
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_read
  ON notifications(user_id, notification_type, is_read);

-- Comment: These indexes optimize common query patterns:
-- 1. created_at DESC: Fast retrieval of recent notifications
-- 2. scheduled_for: Efficient cron job queries for pending scheduled notifications
-- 3. (user_id, notification_type, is_read): Fast filtered queries in NotificationDropdown
