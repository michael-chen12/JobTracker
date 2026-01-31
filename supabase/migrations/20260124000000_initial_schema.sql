-- Migration: Initial Schema for Job Application Tracker
-- Created: 2026-01-24
-- Description: PostgreSQL schema for Job Application Tracker

-- Note: Using gen_random_uuid() which is built-in to PostgreSQL (no extension needed)

-- =============================================
-- USERS & PROFILES
-- =============================================

-- Users table (links to auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  photo_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User profiles (extended user information)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  skills TEXT[] DEFAULT '{}',
  resume_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  phone TEXT,
  location TEXT,
  bio TEXT,
  preferred_job_types TEXT[] DEFAULT '{}',
  preferred_locations TEXT[] DEFAULT '{}',
  salary_expectation JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User experience entries
CREATE TABLE user_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  skills_used TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User education entries
CREATE TABLE user_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  gpa NUMERIC(3, 2),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- JOB APPLICATIONS
-- =============================================

-- Applications table (main entity)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Company & Position
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  job_description TEXT,
  job_url TEXT,
  location TEXT,
  job_type TEXT CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship', 'remote')),

  -- Application Status
  status TEXT DEFAULT 'applied' CHECK (status IN (
    'bookmarked', 'applied', 'screening', 'interviewing',
    'offer', 'rejected', 'accepted', 'withdrawn'
  )) NOT NULL,

  -- Salary & Compensation
  salary_range JSONB, -- { min: number, max: number, currency: string }

  -- AI Matching
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  match_analysis JSONB, -- { matching_skills: [], missing_skills: [], strengths: [], concerns: [] }

  -- Tracking
  applied_date DATE,
  deadline DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),

  -- Metadata
  source TEXT, -- 'linkedin', 'indeed', 'company_website', etc.
  referral_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Application notes (replaces subcollection)
CREATE TABLE application_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'general' CHECK (note_type IN (
    'general', 'interview', 'follow-up', 'research', 'contact'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Application documents (replaces subcollection)
CREATE TABLE application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'resume', 'cover_letter', 'portfolio', 'transcript', 'other'
  )),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- CONTACTS & NETWORKING
-- =============================================

-- Contacts (recruiters, hiring managers, referrals)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  position TEXT,
  linkedin_url TEXT,
  contact_type TEXT CHECK (contact_type IN (
    'recruiter', 'hiring_manager', 'referral', 'colleague', 'other'
  )),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Contact interactions (emails, calls, meetings)
CREATE TABLE contact_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'email', 'call', 'meeting', 'linkedin_message', 'other'
  )),
  interaction_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- NOTIFICATIONS & REMINDERS
-- =============================================

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'deadline', 'follow_up', 'interview', 'offer', 'general'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- TRACKING & ANALYTICS
-- =============================================

-- Milestones (interview rounds, offer stages)
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN (
    'phone_screen', 'technical_interview', 'onsite_interview',
    'final_interview', 'offer_received', 'offer_accepted'
  )),
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- AI usage tracking (for Anthropic API calls)
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  operation TEXT NOT NULL, -- 'resume_parse', 'job_match', 'note_summary'
  tokens_used INTEGER,
  cost_usd NUMERIC(10, 6),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insights (AI-generated career insights)
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN (
    'skill_gap', 'application_pattern', 'success_rate', 'recommendation'
  )),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User lookups
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);

-- Application queries
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX idx_applications_user_status ON applications(user_id, status);

-- Notes and documents
CREATE INDEX idx_application_notes_application_id ON application_notes(application_id);
CREATE INDEX idx_application_documents_application_id ON application_documents(application_id);

-- Contacts
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contact_interactions_contact_id ON contact_interactions(contact_id);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);

-- Full-text search indexes
CREATE INDEX idx_applications_company_position ON applications
  USING gin(to_tsvector('english', company || ' ' || position || ' ' || COALESCE(job_description, '')));

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_notes_updated_at BEFORE UPDATE ON application_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE applications IS 'Main job applications table with AI matching scores';
COMMENT ON TABLE application_notes IS 'Notes for each application';
COMMENT ON TABLE application_documents IS 'Document references stored in Supabase Storage';
COMMENT ON COLUMN applications.match_analysis IS 'JSONB: { matching_skills, missing_skills, strengths, concerns }';
COMMENT ON COLUMN applications.salary_range IS 'JSONB: { min, max, currency }';
