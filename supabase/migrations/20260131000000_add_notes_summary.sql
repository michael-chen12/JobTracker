-- Add notes_summary and summarized_at fields to applications table
-- Ticket #14: Notes Summarization

-- Add notes_summary JSONB field to store AI-generated summaries
ALTER TABLE applications
ADD COLUMN notes_summary JSONB,
ADD COLUMN summarized_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN applications.notes_summary IS 'AI-generated summary of application notes with insights, action items, and follow-up needs';
COMMENT ON COLUMN applications.summarized_at IS 'Timestamp when notes were last summarized';

-- Create index for querying applications that need re-summarization
CREATE INDEX idx_applications_summarized_at ON applications(summarized_at);
