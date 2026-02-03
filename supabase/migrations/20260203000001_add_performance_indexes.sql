-- Migration: Add Performance Indexes
-- Created: 2026-02-03
-- Description: Add composite indexes for common query patterns to improve performance

-- =============================================
-- APPLICATIONS TABLE PERFORMANCE INDEXES
-- =============================================

-- Composite index for user_id + applied_date (frequent filter + sort combination)
CREATE INDEX IF NOT EXISTS idx_applications_user_applied_date
  ON applications(user_id, applied_date DESC NULLS LAST);

-- Composite index for user_id + company (for sorting by company)
CREATE INDEX IF NOT EXISTS idx_applications_user_company
  ON applications(user_id, company);

-- Composite index for user_id + position (for sorting by position)
CREATE INDEX IF NOT EXISTS idx_applications_user_position
  ON applications(user_id, position);

-- Index on referral_contact_id for JOIN optimization (added in ticket #20)
CREATE INDEX IF NOT EXISTS idx_applications_referral_contact_id
  ON applications(referral_contact_id)
  WHERE referral_contact_id IS NOT NULL;

-- Partial index for active applications (most frequently queried subset)
CREATE INDEX IF NOT EXISTS idx_applications_active
  ON applications(user_id, status, created_at DESC)
  WHERE status IN ('applied', 'screening', 'interviewing');

-- =============================================
-- APPLICATION_NOTES TABLE PERFORMANCE
-- =============================================

-- Composite index for application notes with created_at for ordering
CREATE INDEX IF NOT EXISTS idx_application_notes_app_created
  ON application_notes(application_id, created_at DESC);

-- =============================================
-- PERFORMANCE MONITORING COMMENT
-- =============================================

COMMENT ON INDEX idx_applications_user_applied_date IS
  'Optimizes queries filtering by user_id and sorting by applied_date';

COMMENT ON INDEX idx_applications_active IS
  'Partial index for active applications to speed up dashboard queries';

COMMENT ON INDEX idx_applications_referral_contact_id IS
  'Optimizes JOINs with contacts table for referral information';
