-- Advanced Filter Indexes Migration
-- Adds full-text search and optimized indexes for filtering

-- =====================================================
-- Enable Extensions
-- =====================================================
-- Enable trigram extension for fuzzy location search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- Full-Text Search Column
-- =====================================================
-- Add generated tsvector column for full-text search
-- Combines company, position, and job_description for comprehensive search
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS company_position_desc_fts tsvector
GENERATED ALWAYS AS (
  to_tsvector('english',
    company || ' ' ||
    position || ' ' ||
    COALESCE(job_description, '')
  )
) STORED;

-- GIN index for full-text search (fast querying)
CREATE INDEX IF NOT EXISTS idx_applications_fts
  ON applications
  USING gin(company_position_desc_fts);

-- =====================================================
-- Filter-Specific Indexes
-- =====================================================

-- Trigram index for fuzzy location search (handles typos, partial matches)
CREATE INDEX IF NOT EXISTS idx_applications_location_trgm
  ON applications
  USING gin(location gin_trgm_ops)
  WHERE location IS NOT NULL;

-- B-tree index for job type filtering
CREATE INDEX IF NOT EXISTS idx_applications_job_type
  ON applications(user_id, job_type)
  WHERE job_type IS NOT NULL;

-- B-tree index for applied date range queries
CREATE INDEX IF NOT EXISTS idx_applications_applied_date_range
  ON applications(user_id, applied_date)
  WHERE applied_date IS NOT NULL;

-- B-tree index for priority filtering
CREATE INDEX IF NOT EXISTS idx_applications_priority
  ON applications(user_id, priority)
  WHERE priority IS NOT NULL;

-- GIN index for JSONB salary_range queries (supports range operations)
CREATE INDEX IF NOT EXISTS idx_applications_salary_range
  ON applications
  USING gin(salary_range jsonb_path_ops)
  WHERE salary_range IS NOT NULL;

-- Composite index for common filter combinations (status + date)
CREATE INDEX IF NOT EXISTS idx_applications_status_date
  ON applications(user_id, status, applied_date DESC)
  WHERE applied_date IS NOT NULL;

-- =====================================================
-- Comments for Documentation
-- =====================================================
COMMENT ON COLUMN applications.company_position_desc_fts IS
  'Auto-generated full-text search vector for company, position, and job description. Used for fast text search queries.';

COMMENT ON INDEX idx_applications_fts IS
  'GIN index for full-text search on company, position, and job description. Enables sub-500ms search queries.';

COMMENT ON INDEX idx_applications_location_trgm IS
  'Trigram GIN index for fuzzy location matching. Handles typos and partial matches like "San Fran" → "San Francisco".';
