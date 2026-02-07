-- Migration: Create data_export_requests table
-- Ticket #26: Export & GDPR Compliance

CREATE TABLE data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Export details
  export_type TEXT NOT NULL CHECK (export_type IN ('json', 'csv')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_path TEXT,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own export requests"
  ON data_export_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = data_export_requests.user_id AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can insert own export requests"
  ON data_export_requests FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = data_export_requests.user_id AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can update own export requests"
  ON data_export_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = data_export_requests.user_id AND users.auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = data_export_requests.user_id AND users.auth_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX idx_data_export_requests_status ON data_export_requests(user_id, status);
