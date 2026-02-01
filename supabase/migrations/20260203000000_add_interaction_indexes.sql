-- =============================================
-- Ticket #17: Interaction History Tracking
-- Migration: Add Performance Indexes
-- =============================================

-- Index for chronological timeline queries
-- Most common query: Get all interactions for a contact, sorted by date DESC
CREATE INDEX IF NOT EXISTS idx_contact_interactions_contact_date
ON contact_interactions(contact_id, interaction_date DESC);

-- Index for type filtering
-- Allows fast filtering by interaction type (e.g., "show only emails")
CREATE INDEX IF NOT EXISTS idx_contact_interactions_type
ON contact_interactions(interaction_type);

-- Comment: Why these indexes?
-- 1. idx_contact_interactions_contact_date: Composite index for the main query pattern
--    - Covers: WHERE contact_id = X ORDER BY interaction_date DESC
--    - Avoids full table scan when building timeline
-- 2. idx_contact_interactions_type: Supports type filter queries
--    - Covers: WHERE interaction_type IN ('email', 'call')
--    - Small cardinality (5 types) but frequently filtered
