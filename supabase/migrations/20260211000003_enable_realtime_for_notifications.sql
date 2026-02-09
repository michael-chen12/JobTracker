-- Enable Supabase Realtime for notifications table
-- Used by: src/hooks/useNotificationRealtime.ts, src/stores/notification-store.ts

-- Add notifications table to the Realtime publication
-- This allows client-side subscriptions to receive INSERT events in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Comment: This enables the NotificationProvider's Zustand store to receive
-- live updates when new notifications are inserted, allowing the bell badge
-- to update instantly without polling.
