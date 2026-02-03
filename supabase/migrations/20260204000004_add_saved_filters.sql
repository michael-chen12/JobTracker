-- Saved Filter Presets Migration
-- Allows users to save and reuse filter combinations

-- =====================================================
-- Saved Filters Table
-- =====================================================
CREATE TABLE saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_user_filter_name UNIQUE(user_id, name),
  CONSTRAINT valid_filter_name CHECK (name ~ '^[a-zA-Z0-9\s\-_]+$'),
  CONSTRAINT valid_filters_json CHECK (jsonb_typeof(filters) = 'object')
);

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX idx_saved_filters_user_id ON saved_filters(user_id);
CREATE INDEX idx_saved_filters_name ON saved_filters(user_id, name);

-- =====================================================
-- Trigger for updated_at
-- =====================================================
CREATE TRIGGER update_saved_filters_updated_at
  BEFORE UPDATE ON saved_filters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY saved_filters_select ON saved_filters
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY saved_filters_insert ON saved_filters
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY saved_filters_update ON saved_filters
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY saved_filters_delete ON saved_filters
  FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE saved_filters IS
  'User-defined filter presets for quick access to common filter combinations. Syncs across devices.';

COMMENT ON COLUMN saved_filters.filters IS
  'JSONB object containing the filter parameters (search, status, location, tags, etc.)';
