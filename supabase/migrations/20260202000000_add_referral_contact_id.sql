-- Migration: Add referral_contact_id and enhance contacts table
-- Ticket #16: Contact Management
-- Created: 2026-02-02
-- Description: Link applications to referral contacts with enhanced search and security

-- =============================================
-- ADD REFERRAL_CONTACT_ID TO APPLICATIONS
-- =============================================

-- Add referral_contact_id column with foreign key to contacts table
-- ON DELETE SET NULL: Preserve application history when contact is deleted
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS referral_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

COMMENT ON COLUMN applications.referral_contact_id
IS 'Optional reference to a contact who referred this application. Allows tracking which contacts helped with which applications.';

-- =============================================
-- ENHANCE CONTACTS TABLE
-- =============================================

-- Add last_interaction_date for sorting by recent activity
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS last_interaction_date TIMESTAMPTZ;

COMMENT ON COLUMN contacts.last_interaction_date
IS 'Automatically updated when a new interaction is recorded. Used for sorting contacts by recent activity.';

-- Add tags array for flexible categorization
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

COMMENT ON COLUMN contacts.tags
IS 'Array of custom tags for categorizing contacts (e.g., ["warm-lead", "senior-engineer", "referral-source"])';

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Index for joining applications with referral contacts
CREATE INDEX IF NOT EXISTS idx_applications_referral_contact_id
ON applications(referral_contact_id);

-- Composite index for user queries with referral contacts (partial index for non-null values)
CREATE INDEX IF NOT EXISTS idx_applications_user_referral
ON applications(user_id, referral_contact_id)
WHERE referral_contact_id IS NOT NULL;

-- Index for contact type filtering
CREATE INDEX IF NOT EXISTS idx_contacts_user_type
ON contacts(user_id, contact_type);

-- Index for sorting by last interaction (NULLS LAST for better performance)
CREATE INDEX IF NOT EXISTS idx_contacts_last_interaction
ON contacts(user_id, last_interaction_date DESC NULLS LAST);

-- GIN index for tag searches (array overlap queries)
CREATE INDEX IF NOT EXISTS idx_contacts_tags
ON contacts USING gin(tags);

-- Full-text search index for contacts (name, company, position, notes)
-- Using GIN index with to_tsvector for efficient text search
CREATE INDEX IF NOT EXISTS idx_contacts_search
ON contacts USING gin(
  to_tsvector('english',
    COALESCE(name, '') || ' ' ||
    COALESCE(company, '') || ' ' ||
    COALESCE(position, '') || ' ' ||
    COALESCE(notes, '')
  )
);

-- =============================================
-- AUTO-UPDATE LAST INTERACTION DATE
-- =============================================

-- Function to auto-update last_interaction_date when interaction is added
CREATE OR REPLACE FUNCTION update_contact_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contacts
  SET last_interaction_date = NEW.interaction_date
  WHERE id = NEW.contact_id
  AND (last_interaction_date IS NULL OR last_interaction_date < NEW.interaction_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_interaction_date after insert/update on contact_interactions
DROP TRIGGER IF EXISTS update_contact_last_interaction_trigger ON contact_interactions;
CREATE TRIGGER update_contact_last_interaction_trigger
AFTER INSERT OR UPDATE ON contact_interactions
FOR EACH ROW
EXECUTE FUNCTION update_contact_last_interaction();

-- Backfill existing contacts with last interaction date
UPDATE contacts
SET last_interaction_date = (
  SELECT MAX(interaction_date)
  FROM contact_interactions
  WHERE contact_interactions.contact_id = contacts.id
)
WHERE last_interaction_date IS NULL
AND EXISTS (
  SELECT 1 FROM contact_interactions WHERE contact_interactions.contact_id = contacts.id
);

-- =============================================
-- ENHANCED RLS POLICIES (SECURITY FIX)
-- =============================================

-- Drop the existing broad "manage all" policy
DROP POLICY IF EXISTS "Users can manage own contacts" ON contacts;

-- Create granular policies for better security audit trail

-- SELECT: Users can view their own contacts
CREATE POLICY "Users can view own contacts"
  ON contacts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = contacts.user_id
    AND users.auth_id = auth.uid()
  ));

-- INSERT: Users can create contacts with their own user_id
CREATE POLICY "Users can create own contacts"
  ON contacts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = contacts.user_id
    AND users.auth_id = auth.uid()
  ));

-- UPDATE: Users can update their own contacts
CREATE POLICY "Users can update own contacts"
  ON contacts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = contacts.user_id
    AND users.auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = contacts.user_id
    AND users.auth_id = auth.uid()
  ));

-- DELETE: Users can delete their own contacts
CREATE POLICY "Users can delete own contacts"
  ON contacts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = contacts.user_id
    AND users.auth_id = auth.uid()
  ));

-- =============================================
-- CONTACT INTERACTIONS RLS (NESTED OWNERSHIP)
-- =============================================

-- Drop existing broad policy
DROP POLICY IF EXISTS "Users can manage interactions for own contacts" ON contact_interactions;

-- SELECT: Users can view interactions for their own contacts
CREATE POLICY "Users can view interactions for own contacts"
  ON contact_interactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM contacts
    JOIN users ON users.id = contacts.user_id
    WHERE contacts.id = contact_interactions.contact_id
    AND users.auth_id = auth.uid()
  ));

-- INSERT: Users can create interactions for their own contacts
CREATE POLICY "Users can create interactions for own contacts"
  ON contact_interactions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM contacts
    JOIN users ON users.id = contacts.user_id
    WHERE contacts.id = contact_interactions.contact_id
    AND users.auth_id = auth.uid()
  ));

-- UPDATE: Users can update interactions for their own contacts
CREATE POLICY "Users can update interactions for own contacts"
  ON contact_interactions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM contacts
    JOIN users ON users.id = contacts.user_id
    WHERE contacts.id = contact_interactions.contact_id
    AND users.auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM contacts
    JOIN users ON users.id = contacts.user_id
    WHERE contacts.id = contact_interactions.contact_id
    AND users.auth_id = auth.uid()
  ));

-- DELETE: Users can delete interactions for their own contacts
CREATE POLICY "Users can delete interactions for own contacts"
  ON contact_interactions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM contacts
    JOIN users ON users.id = contacts.user_id
    WHERE contacts.id = contact_interactions.contact_id
    AND users.auth_id = auth.uid()
  ));

-- =============================================
-- MIGRATION VERIFICATION
-- =============================================

-- Verify referral_contact_id column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications'
    AND column_name = 'referral_contact_id'
  ) THEN
    RAISE EXCEPTION 'Migration failed: referral_contact_id column not created';
  END IF;
END $$;

-- Verify indexes created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'applications'
    AND indexname = 'idx_applications_referral_contact_id'
  ) THEN
    RAISE EXCEPTION 'Migration failed: idx_applications_referral_contact_id not created';
  END IF;
END $$;

-- Verify trigger created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_contact_last_interaction_trigger'
  ) THEN
    RAISE EXCEPTION 'Migration failed: update_contact_last_interaction_trigger not created';
  END IF;
END $$;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20260202000000_add_referral_contact_id completed successfully';
  RAISE NOTICE '  ✓ Added referral_contact_id to applications table';
  RAISE NOTICE '  ✓ Added last_interaction_date to contacts table';
  RAISE NOTICE '  ✓ Added tags array to contacts table';
  RAISE NOTICE '  ✓ Created 6 performance indexes';
  RAISE NOTICE '  ✓ Split RLS policies into granular SELECT/INSERT/UPDATE/DELETE';
  RAISE NOTICE '  ✓ Created auto-update trigger for last_interaction_date';
  RAISE NOTICE '  ✓ Backfilled existing contacts with last interaction date';
END $$;
