-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add resume parsing columns to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS parsed_resume_data JSONB,
ADD COLUMN IF NOT EXISTS resume_parsed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resume_parsing_error TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[];

-- Create resume_parsing_jobs table
CREATE TABLE IF NOT EXISTS resume_parsing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_resume_parsing_jobs_user_id ON resume_parsing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_parsing_jobs_status ON resume_parsing_jobs(status);

-- Enable RLS on resume_parsing_jobs
ALTER TABLE resume_parsing_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own parsing jobs
CREATE POLICY "Users can view own parsing jobs"
  ON resume_parsing_jobs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can manage all jobs
CREATE POLICY "Service role can manage all jobs"
  ON resume_parsing_jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
