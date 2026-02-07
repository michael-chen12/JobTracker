-- Migration: Create application_correspondence table
-- Ticket #25: Email Correspondence (Manual-First Approach)

CREATE TABLE application_correspondence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,

  -- Core email metadata
  subject TEXT NOT NULL,
  sender TEXT NOT NULL,
  recipient TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  correspondence_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  notes TEXT,

  -- Future Gmail API integration (nullable)
  gmail_message_id TEXT,
  gmail_thread_id TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE application_correspondence ENABLE ROW LEVEL SECURITY;

-- RLS Policies (mirroring application_documents pattern)
CREATE POLICY "Users can view correspondence for own applications"
  ON application_correspondence FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM applications
    JOIN users ON users.id = applications.user_id
    WHERE applications.id = application_correspondence.application_id
    AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can insert correspondence for own applications"
  ON application_correspondence FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM applications
    JOIN users ON users.id = applications.user_id
    WHERE applications.id = application_correspondence.application_id
    AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can update correspondence for own applications"
  ON application_correspondence FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM applications
    JOIN users ON users.id = applications.user_id
    WHERE applications.id = application_correspondence.application_id
    AND users.auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM applications
    JOIN users ON users.id = applications.user_id
    WHERE applications.id = application_correspondence.application_id
    AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can delete correspondence for own applications"
  ON application_correspondence FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM applications
    JOIN users ON users.id = applications.user_id
    WHERE applications.id = application_correspondence.application_id
    AND users.auth_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_correspondence_application_id
  ON application_correspondence(application_id);
CREATE INDEX idx_correspondence_application_date
  ON application_correspondence(application_id, correspondence_date DESC);
CREATE INDEX idx_correspondence_direction
  ON application_correspondence(application_id, direction);
CREATE INDEX idx_correspondence_gmail_thread
  ON application_correspondence(gmail_thread_id)
  WHERE gmail_thread_id IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_application_correspondence_updated_at
  BEFORE UPDATE ON application_correspondence
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
