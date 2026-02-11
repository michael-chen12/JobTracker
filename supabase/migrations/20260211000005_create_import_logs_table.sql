-- Migration: Create import_logs table
-- Ticket #33: Integration Marketplace - ATS Imports
-- Tracks each bulk import batch for history and auditing

CREATE TABLE import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Source identification
  source TEXT NOT NULL CHECK (source IN ('linkedin', 'indeed', 'greenhouse', 'generic_csv')),

  -- Batch statistics
  total_rows      INTEGER NOT NULL DEFAULT 0,
  imported_count  INTEGER NOT NULL DEFAULT 0,
  skipped_count   INTEGER NOT NULL DEFAULT 0,
  failed_count    INTEGER NOT NULL DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  -- Greenhouse-specific metadata (user-typed company name; NULL for CSV sources)
  greenhouse_company TEXT,

  -- Timestamps
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (same pattern as data_export_requests)
CREATE POLICY "Users can view own import logs"
  ON import_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = import_logs.user_id
      AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can insert own import logs"
  ON import_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = import_logs.user_id
      AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can update own import logs"
  ON import_logs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = import_logs.user_id
      AND users.auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = import_logs.user_id
      AND users.auth_id = auth.uid()
  ));

-- Indexes for efficient querying
CREATE INDEX idx_import_logs_user_id
  ON import_logs(user_id);

CREATE INDEX idx_import_logs_user_created
  ON import_logs(user_id, created_at DESC);
