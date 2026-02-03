-- Fix Tags RLS Policies to use correct user_id mapping
-- The original policies used auth.uid() directly, but user_id references public.users.id
-- Need to map auth.uid() → users.auth_id → users.id

-- Drop existing policies
DROP POLICY IF EXISTS tags_select ON tags;
DROP POLICY IF EXISTS tags_insert ON tags;
DROP POLICY IF EXISTS tags_update ON tags;
DROP POLICY IF EXISTS tags_delete ON tags;

-- Recreate with correct mapping
CREATE POLICY tags_select ON tags
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY tags_insert ON tags
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY tags_update ON tags
  FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY tags_delete ON tags
  FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );
