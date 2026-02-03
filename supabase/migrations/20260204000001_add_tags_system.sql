-- Tags Infrastructure Migration
-- Creates tables for tags and application-tag relationships with proper RLS

-- =====================================================
-- Tags Table
-- =====================================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_user_tag UNIQUE(user_id, name),
  CONSTRAINT valid_tag_name CHECK (name ~ '^[a-zA-Z0-9\s\-_]+$'),
  CONSTRAINT valid_color CHECK (color ~ '^#[0-9A-F]{6}$')
);

-- =====================================================
-- Application-Tags Junction Table (Many-to-Many)
-- =====================================================
CREATE TABLE application_tags (
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (application_id, tag_id)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_name ON tags(user_id, name);
CREATE INDEX idx_application_tags_app ON application_tags(application_id);
CREATE INDEX idx_application_tags_tag ON application_tags(tag_id);

-- =====================================================
-- Trigger for updated_at
-- =====================================================
CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_tags ENABLE ROW LEVEL SECURITY;

-- Tags Policies
CREATE POLICY tags_select ON tags
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY tags_insert ON tags
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY tags_update ON tags
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY tags_delete ON tags
  FOR DELETE
  USING (user_id = auth.uid());

-- Application-Tags Policies
CREATE POLICY application_tags_select ON application_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE id = application_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY application_tags_insert ON application_tags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE id = application_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY application_tags_delete ON application_tags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE id = application_id
      AND user_id = auth.uid()
    )
  );
