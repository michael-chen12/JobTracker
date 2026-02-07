-- Migration: Create account_deletion_requests table
-- Ticket #26: Export & GDPR Compliance

CREATE TABLE account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Deletion details
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'processing', 'completed')),
  reason TEXT,
  scheduled_deletion_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own deletion requests"
  ON account_deletion_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = account_deletion_requests.user_id AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can insert own deletion requests"
  ON account_deletion_requests FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = account_deletion_requests.user_id AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can update own deletion requests"
  ON account_deletion_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = account_deletion_requests.user_id AND users.auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = account_deletion_requests.user_id AND users.auth_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_account_deletion_requests_user_id ON account_deletion_requests(user_id);
CREATE INDEX idx_account_deletion_requests_scheduled ON account_deletion_requests(status, scheduled_deletion_at)
  WHERE status = 'pending';
