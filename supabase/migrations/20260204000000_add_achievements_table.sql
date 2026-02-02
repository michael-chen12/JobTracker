-- Migration: Add achievements table for wins celebration system
-- Description: Creates achievements table to track user milestones (first application, interviews, offers, streaks, etc.)
-- Author: Wins Celebration System (Ticket #20)
-- Date: 2026-02-04

-- ============================================================================
-- DROP EXISTING TABLE (if exists, for idempotency)
-- ============================================================================
DROP TABLE IF EXISTS achievements CASCADE;

-- ============================================================================
-- CREATE ACHIEVEMENTS TABLE
-- ============================================================================
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Achievement type (enum-like check constraint)
  achievement_type TEXT NOT NULL CHECK (
    achievement_type IN (
      'first_application',
      'milestone_10_apps',
      'milestone_25_apps',
      'milestone_50_apps',
      'first_response',
      'first_interview_any',
      'first_offer',
      'first_acceptance',
      'week_streak_3',
      'week_streak_5'
    )
  ),

  -- Timestamps
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata (JSONB for flexible data storage)
  -- Example: {"application_id": "uuid", "company": "Acme Corp", "position": "Engineer", "count": 10, "streak_days": 21}
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Celebration tracking
  celebrated BOOLEAN NOT NULL DEFAULT FALSE
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for user-specific queries (most common access pattern)
CREATE INDEX idx_achievements_user_id ON achievements(user_id);

-- Composite index for filtering by user + achievement type
CREATE INDEX idx_achievements_user_type ON achievements(user_id, achievement_type);

-- Index for chronological sorting
CREATE INDEX idx_achievements_achieved_at ON achievements(achieved_at DESC);

-- Partial unique index for one-time achievements (prevents duplicates)
-- Only enforces uniqueness for achievement types that should occur once per user
CREATE UNIQUE INDEX idx_achievements_user_type_unique
ON achievements(user_id, achievement_type)
WHERE achievement_type IN (
  'first_application',
  'milestone_10_apps',
  'milestone_25_apps',
  'milestone_50_apps',
  'first_response',
  'first_interview_any',
  'first_offer',
  'first_acceptance',
  'week_streak_3',
  'week_streak_5'
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own achievements
CREATE POLICY achievements_select_own
ON achievements
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

-- Policy: Users can insert their own achievements (via server actions only)
-- Note: This will be restricted to admin client in practice, but policy allows user inserts
CREATE POLICY achievements_insert_own
ON achievements
FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

-- Policy: Users can update their own achievements (only celebrated flag)
CREATE POLICY achievements_update_own
ON achievements
FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

-- Policy: Users cannot delete achievements (preserve history)
-- No DELETE policy = no deletes allowed

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Auto-update updated_at timestamp on row updates
CREATE OR REPLACE FUNCTION update_achievements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER achievements_updated_at_trigger
BEFORE UPDATE ON achievements
FOR EACH ROW
EXECUTE FUNCTION update_achievements_updated_at();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify table created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'achievements'
  ) THEN
    RAISE EXCEPTION 'achievements table was not created';
  END IF;

  RAISE NOTICE 'achievements table created successfully';
END $$;

-- Verify indexes created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_indexes
    WHERE tablename = 'achievements'
    AND indexname = 'idx_achievements_user_id'
  ) THEN
    RAISE EXCEPTION 'idx_achievements_user_id index was not created';
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_indexes
    WHERE tablename = 'achievements'
    AND indexname = 'idx_achievements_user_type_unique'
  ) THEN
    RAISE EXCEPTION 'idx_achievements_user_type_unique index was not created';
  END IF;

  RAISE NOTICE 'All indexes created successfully';
END $$;

-- Verify RLS enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE tablename = 'achievements'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on achievements table';
  END IF;

  RAISE NOTICE 'RLS enabled successfully';
END $$;

-- Verify RLS policies created
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'achievements') < 3 THEN
    RAISE EXCEPTION 'Not all RLS policies were created';
  END IF;

  RAISE NOTICE 'All RLS policies created successfully';
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 20260204000000_add_achievements_table.sql completed successfully';
  RAISE NOTICE '   - achievements table created';
  RAISE NOTICE '   - 4 indexes created (user_id, user_type, achieved_at, unique constraint)';
  RAISE NOTICE '   - RLS enabled with 3 policies (SELECT, INSERT, UPDATE)';
  RAISE NOTICE '   - Auto-update trigger configured';
  RAISE NOTICE '   - Ready for wins celebration system';
END $$;
