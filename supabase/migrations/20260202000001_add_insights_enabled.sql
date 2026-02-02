-- Migration: Add insights_enabled privacy control
-- Created: 2026-02-02
-- Description: Add insights_enabled column to user_profiles for privacy controls

ALTER TABLE user_profiles
ADD COLUMN insights_enabled BOOLEAN DEFAULT true NOT NULL;

COMMENT ON COLUMN user_profiles.insights_enabled IS 'Privacy control: whether to show activity insights and wellness prompts';
