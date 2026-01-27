-- Add analyzed_at field to applications table for tracking when job match analysis was performed

ALTER TABLE applications
ADD COLUMN analyzed_at TIMESTAMPTZ;

COMMENT ON COLUMN applications.analyzed_at IS 'Timestamp when the last job match analysis was performed';
