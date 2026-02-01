-- Migration: Add follow-up suggestions support to applications table
-- Ticket #15: Follow-Up Suggestions
-- Created: 2026-02-01

-- Add columns for follow-up suggestions
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS follow_up_suggestions JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS followup_suggestions_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for future queries (e.g., finding stale suggestions)
CREATE INDEX IF NOT EXISTS idx_applications_followup_suggestions_at
ON applications(followup_suggestions_at)
WHERE followup_suggestions_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN applications.follow_up_suggestions IS 'AI-generated follow-up suggestions with actions, timing, priority, and templates';
COMMENT ON COLUMN applications.followup_suggestions_at IS 'Timestamp when follow-up suggestions were last generated';
