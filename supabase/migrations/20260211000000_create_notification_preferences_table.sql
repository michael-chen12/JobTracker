-- Create notification_preferences table for per-user notification toggle settings
-- Used by: src/actions/notifications.ts, src/lib/notifications/trigger.ts

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- In-app notification toggles (default true = enabled)
  in_app_follow_up BOOLEAN NOT NULL DEFAULT true,
  in_app_deadline BOOLEAN NOT NULL DEFAULT true,
  in_app_interview BOOLEAN NOT NULL DEFAULT true,
  in_app_offer BOOLEAN NOT NULL DEFAULT true,
  in_app_achievement BOOLEAN NOT NULL DEFAULT true,
  in_app_general BOOLEAN NOT NULL DEFAULT true,

  -- Email notification toggles (default false = opt-in required)
  email_follow_up BOOLEAN NOT NULL DEFAULT false,
  email_deadline BOOLEAN NOT NULL DEFAULT false,
  email_interview BOOLEAN NOT NULL DEFAULT false,
  email_offer BOOLEAN NOT NULL DEFAULT false,
  email_weekly_digest BOOLEAN NOT NULL DEFAULT false,

  -- Push notification toggles (default false = opt-in required)
  push_follow_up BOOLEAN NOT NULL DEFAULT false,
  push_deadline BOOLEAN NOT NULL DEFAULT false,
  push_interview BOOLEAN NOT NULL DEFAULT false,
  push_offer BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one preferences row per user
  CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own preferences
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = notification_preferences.user_id
        AND users.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = notification_preferences.user_id
        AND users.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = notification_preferences.user_id
        AND users.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = notification_preferences.user_id
        AND users.auth_id = auth.uid()
    )
  );

-- Index for faster lookups by user_id
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
