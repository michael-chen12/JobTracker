-- Create push_subscriptions table for Web Push API subscriptions
-- Used by: src/actions/notifications.ts, src/lib/push/web-push.ts

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Web Push API subscription fields
  endpoint TEXT NOT NULL,      -- Push service endpoint URL
  p256dh TEXT NOT NULL,         -- VAPID public key (P-256 ECDH)
  auth TEXT NOT NULL,           -- Authentication secret

  -- Device tracking (optional)
  user_agent TEXT,              -- Browser/device info for debugging

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate subscriptions per device
  CONSTRAINT push_subscriptions_user_endpoint_key UNIQUE (user_id, endpoint)
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own push subscriptions (all operations)
CREATE POLICY "Users can manage own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = push_subscriptions.user_id
        AND users.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = push_subscriptions.user_id
        AND users.auth_id = auth.uid()
    )
  );

-- Indexes for efficient queries
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX idx_push_subscriptions_last_used_at ON push_subscriptions(last_used_at);

-- Comment: Auto-cleanup of stale subscriptions happens in application code
-- when push delivery fails with 410/404 (subscription expired/invalid)
