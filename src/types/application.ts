import { Database } from './database';

// Database table types (auto-generated from Supabase)
export type User = Database['public']['Tables']['users']['Row'];
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserExperience = Database['public']['Tables']['user_experience']['Row'];
export type UserEducation = Database['public']['Tables']['user_education']['Row'];

export type Application = Database['public']['Tables']['applications']['Row'];
export type ApplicationNote = Database['public']['Tables']['application_notes']['Row'];
export type ApplicationDocument = Database['public']['Tables']['application_documents']['Row'];
export type Achievement = Database['public']['Tables']['achievements']['Row'];

export type Contact = Database['public']['Tables']['contacts']['Row'];
export type ContactInteraction = Database['public']['Tables']['contact_interactions']['Row'];

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Milestone = Database['public']['Tables']['milestones']['Row'];
export type AIUsage = Database['public']['Tables']['ai_usage']['Row'];
export type Insight = Database['public']['Tables']['insights']['Row'];

// Correspondence types (Ticket #25: Email Correspondence)
export type CorrespondenceDirection = 'inbound' | 'outbound';

// Manual type definition (until database types are regenerated)
export type ApplicationCorrespondence = {
  id: string;
  application_id: string;
  subject: string;
  sender: string;
  recipient: string | null;
  direction: CorrespondenceDirection;
  correspondence_date: string;
  notes: string | null;
  gmail_message_id: string | null;
  gmail_thread_id: string | null;
  created_at: string;
  updated_at: string;
};

// Data Export types (Ticket #26: Export & GDPR Compliance)
export type ExportType = 'json' | 'csv';
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type DataExportRequest = {
  id: string;
  user_id: string;
  export_type: ExportType;
  status: ExportStatus;
  file_path: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
};

// Account Deletion types (Ticket #26: Export & GDPR Compliance)
export type DeletionStatus = 'pending' | 'cancelled' | 'processing' | 'completed';

export type AccountDeletionRequest = {
  id: string;
  user_id: string;
  status: DeletionStatus;
  reason: string | null;
  scheduled_deletion_at: string;
  cancelled_at: string | null;
  created_at: string;
};

// Manual Tag type definition (until database types are regenerated)
export type Tag = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
};

// Insert types (for creating new records)
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];
export type ApplicationNoteInsert = Database['public']['Tables']['application_notes']['Insert'];
export type ContactInsert = Database['public']['Tables']['contacts']['Insert'];

// Update types (for partial updates)
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type ApplicationUpdate = Database['public']['Tables']['applications']['Update'];

// Enums for application status (matching database CHECK constraints)
export type ApplicationStatus =
  | 'bookmarked'
  | 'applied'
  | 'screening'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'accepted'
  | 'withdrawn';

export type ApplicationPriority = 'low' | 'medium' | 'high';

export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';

export type NoteType = 'general' | 'interview' | 'follow-up' | 'research' | 'contact';

export type DocumentType = 'resume' | 'cover_letter' | 'portfolio' | 'transcript' | 'correspondence' | 'other';

export type ContactType = 'recruiter' | 'hiring_manager' | 'referral' | 'colleague' | 'other';

export type InteractionType = 'email' | 'call' | 'meeting' | 'linkedin_message' | 'other';

export type NotificationType = 'deadline' | 'follow_up' | 'interview' | 'offer' | 'general';

export type MilestoneType =
  | 'phone_screen'
  | 'technical_interview'
  | 'onsite_interview'
  | 'final_interview'
  | 'offer_received'
  | 'offer_accepted';

export type InsightType = 'skill_gap' | 'application_pattern' | 'success_rate' | 'recommendation';

// Complex types for JSONB fields
export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
}

export interface MatchAnalysis {
  matching_skills: string[];
  missing_skills: string[];
  strengths: string[];
  concerns: string[];
}

// Composite types for UI (with related data)
export interface ApplicationWithNotes extends Application {
  notes: ApplicationNote[];
}

export interface ApplicationWithDocuments extends Application {
  documents: ApplicationDocument[];
}

export interface ApplicationWithRelations extends Application {
  notes: ApplicationNote[];
  documents: ApplicationDocument[];
  milestones: Milestone[];
  achievements?: Achievement[];
  correspondence?: ApplicationCorrespondence[];
}

export interface ApplicationWithTags extends Application {
  tags: Tag[];
}

export interface UserWithProfile extends User {
  profile: UserProfile | null;
}

export interface ContactWithInteractions extends Contact {
  interactions: ContactInteraction[];
}

// Form data types (for client-side forms before DB insert)
export interface ApplicationFormData {
  company: string;
  position: string;
  job_description?: string;
  job_url?: string;
  location?: string;
  job_type?: JobType;
  status: ApplicationStatus;
  salary_range?: SalaryRange;
  applied_date?: string; // ISO date string
  deadline?: string; // ISO date string
  priority?: ApplicationPriority;
  source?: string;
  referral_name?: string;
}

export interface NoteFormData {
  content: string;
  note_type?: NoteType;
}

export interface ContactFormData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  linkedin_url?: string;
  contact_type?: ContactType;
  notes?: string;
}
