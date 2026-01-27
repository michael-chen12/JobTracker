/**
 * AI service types and interfaces
 */

export type OperationType = 'resume_parse' | 'summarize_notes' | 'job_analysis';

export interface AIUsageLog {
  id: string;
  user_id: string;
  operation_type: OperationType;
  timestamp: string;
  tokens_used?: number;
  cost_estimate?: number;
  model_version?: string;
  latency_ms?: number;
  success: boolean;
  error_message?: string;
  input_sample?: string;
  output_sample?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface RateLimitConfig {
  resume_parse: number;      // 10 per hour
  summarize_notes: number;   // 50 per hour
  job_analysis: number;      // 10 per hour
}

export interface AIServiceResponse<T> {
  data?: T;
  error?: string;
}

// Resume parsing output
export interface ParsedResume {
  skills: string[];
  experience: Experience[];
  education: Education[];
  contact?: ContactInfo;
  summary?: string;
}

export interface Experience {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  graduationDate?: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  linkedin?: string;
}

// Notes summarization output
export interface NotesSummary {
  summary: string;
  insights: string[];
  actionItems: string[];
}

// Job matching output
export interface MatchAnalysis {
  base_score: number;
  adjusted_score: number;
  adjustment: number;
  reasoning: string;
  matching_skills: string[];
  missing_skills: string[];
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  breakdown: {
    skills_score: number;
    experience_score: number;
    education_score: number;
    other_score: number;
  };
}

export interface JobMatchAnalysis {
  score: number;
  matchingSkills: string[];
  missingSkills: string[];
  explanation: string;
}
