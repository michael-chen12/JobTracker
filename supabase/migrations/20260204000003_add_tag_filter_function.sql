-- Database Function for Tag Filtering
-- Efficiently finds applications that have ALL specified tags (AND logic)

-- =====================================================
-- Function: Get Applications with All Tags
-- =====================================================
CREATE OR REPLACE FUNCTION get_applications_with_all_tags(
  p_user_id UUID,
  p_tag_ids UUID[]
)
RETURNS TABLE (id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT a.id
  FROM applications a
  WHERE a.user_id = p_user_id
    AND (
      -- Application has all specified tags
      SELECT COUNT(DISTINCT at.tag_id)
      FROM application_tags at
      WHERE at.application_id = a.id
        AND at.tag_id = ANY(p_tag_ids)
    ) = array_length(p_tag_ids, 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON FUNCTION get_applications_with_all_tags IS
  'Returns applications that have ALL specified tags (AND logic). Used for advanced tag filtering in the application list.';
