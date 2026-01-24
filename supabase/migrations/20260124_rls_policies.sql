-- Migration: Row Level Security Policies
-- Created: 2026-01-24
-- Description: RLS policies ensuring users can only access their own data

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USERS TABLE POLICIES
-- =============================================

-- Users can view their own user record
CREATE POLICY "Users can view own user record"
  ON users FOR SELECT
  USING (auth.uid() = auth_id);

-- Users can update their own user record
CREATE POLICY "Users can update own user record"
  ON users FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- Users can insert their own user record (on signup)
CREATE POLICY "Users can insert own user record"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = auth_id);

-- =============================================
-- USER PROFILES POLICIES
-- =============================================

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = user_profiles.user_id AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = user_profiles.user_id AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = user_profiles.user_id AND users.auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = user_profiles.user_id AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can delete own profile"
  ON user_profiles FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = user_profiles.user_id AND users.auth_id = auth.uid()
  ));

-- =============================================
-- USER EXPERIENCE POLICIES
-- =============================================

CREATE POLICY "Users can manage own experience"
  ON user_experience FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = user_experience.user_id AND users.auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = user_experience.user_id AND users.auth_id = auth.uid()
  ));

-- =============================================
-- USER EDUCATION POLICIES
-- =============================================

CREATE POLICY "Users can manage own education"
  ON user_education FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = user_education.user_id AND users.auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = user_education.user_id AND users.auth_id = auth.uid()
  ));

-- =============================================
-- APPLICATIONS POLICIES
-- =============================================

CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = applications.user_id AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can insert own applications"
  ON applications FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = applications.user_id AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = applications.user_id AND users.auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = applications.user_id AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can delete own applications"
  ON applications FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = applications.user_id AND users.auth_id = auth.uid()
  ));

-- =============================================
-- APPLICATION NOTES POLICIES (Nested ownership)
-- =============================================

-- Notes inherit ownership from parent application
CREATE POLICY "Users can view notes for own applications"
  ON application_notes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM applications
    JOIN users ON users.id = applications.user_id
    WHERE applications.id = application_notes.application_id
    AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can insert notes for own applications"
  ON application_notes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM applications
    JOIN users ON users.id = applications.user_id
    WHERE applications.id = application_notes.application_id
    AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can update notes for own applications"
  ON application_notes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM applications
    JOIN users ON users.id = applications.user_id
    WHERE applications.id = application_notes.application_id
    AND users.auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM applications
    JOIN users ON users.id = applications.user_id
    WHERE applications.id = application_notes.application_id
    AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can delete notes for own applications"
  ON application_notes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM applications
    JOIN users ON users.id = applications.user_id
    WHERE applications.id = application_notes.application_id
    AND users.auth_id = auth.uid()
  ));

-- =============================================
-- APPLICATION DOCUMENTS POLICIES
-- =============================================

CREATE POLICY "Users can view documents for own applications"
  ON application_documents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM applications
    JOIN users ON users.id = applications.user_id
    WHERE applications.id = application_documents.application_id
    AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can insert documents for own applications"
  ON application_documents FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM applications
    JOIN users ON users.id = applications.user_id
    WHERE applications.id = application_documents.application_id
    AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can delete documents for own applications"
  ON application_documents FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM applications
    JOIN users ON users.id = applications.user_id
    WHERE applications.id = application_documents.application_id
    AND users.auth_id = auth.uid()
  ));

-- =============================================
-- CONTACTS POLICIES
-- =============================================

CREATE POLICY "Users can manage own contacts"
  ON contacts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = contacts.user_id AND users.auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = contacts.user_id AND users.auth_id = auth.uid()
  ));

-- =============================================
-- CONTACT INTERACTIONS POLICIES
-- =============================================

CREATE POLICY "Users can manage interactions for own contacts"
  ON contact_interactions FOR ALL
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

-- =============================================
-- NOTIFICATIONS POLICIES
-- =============================================

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = notifications.user_id AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = notifications.user_id AND users.auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = notifications.user_id AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = notifications.user_id AND users.auth_id = auth.uid()
  ));

-- =============================================
-- MILESTONES POLICIES
-- =============================================

CREATE POLICY "Users can manage milestones for own applications"
  ON milestones FOR ALL
  USING (EXISTS (
    SELECT 1 FROM applications
    JOIN users ON users.id = applications.user_id
    WHERE applications.id = milestones.application_id
    AND users.auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM applications
    JOIN users ON users.id = applications.user_id
    WHERE applications.id = milestones.application_id
    AND users.auth_id = auth.uid()
  ));

-- =============================================
-- AI USAGE POLICIES (Read-only for users)
-- =============================================

CREATE POLICY "Users can view own AI usage"
  ON ai_usage FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = ai_usage.user_id AND users.auth_id = auth.uid()
  ));

-- =============================================
-- INSIGHTS POLICIES
-- =============================================

CREATE POLICY "Users can view own insights"
  ON insights FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = insights.user_id AND users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can update own insights"
  ON insights FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = insights.user_id AND users.auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = insights.user_id AND users.auth_id = auth.uid()
  ));

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON POLICY "Users can view notes for own applications" ON application_notes
  IS 'Nested ownership: Notes inherit access control from parent application';

COMMENT ON POLICY "Users can view own AI usage" ON ai_usage
  IS 'Read-only policy: AI usage records are created by server-side functions only';
