import { z } from 'zod';

// Application status validation
export const applicationStatusSchema = z.enum([
  'bookmarked',
  'applied',
  'screening',
  'interviewing',
  'offer',
  'rejected',
  'accepted',
  'withdrawn',
]);

export const applicationPrioritySchema = z.enum(['low', 'medium', 'high']);

export const jobTypeSchema = z.enum([
  'full-time',
  'part-time',
  'contract',
  'internship',
  'remote',
]);

export const noteTypeSchema = z.enum([
  'general',
  'interview',
  'follow-up',
  'research',
  'contact',
]);

// Salary range schema
export const salaryRangeSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
  currency: z.string().length(3), // ISO 4217 currency code (USD, EUR, etc.)
});

// Application creation schema
export const createApplicationSchema = z.object({
  company: z.string().min(1, 'Company name is required').max(255),
  position: z.string().min(1, 'Position is required').max(255),
  job_description: z.string().optional(),
  job_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  location: z.string().max(255).optional(),
  job_type: jobTypeSchema.optional(),
  status: applicationStatusSchema.default('applied'),
  salary_range: salaryRangeSchema.optional(),
  applied_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format').optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format').optional(),
  priority: applicationPrioritySchema.default('medium'),
  source: z.string().max(100).optional(),
  referral_name: z.string().max(255).optional(),
});

// Application update schema (all fields optional)
export const updateApplicationSchema = createApplicationSchema.partial();

// Note creation schema
export const createNoteSchema = z.object({
  application_id: z.string().uuid('Invalid application ID'),
  content: z.string().min(1, 'Note content is required'),
  note_type: noteTypeSchema.default('general'),
});

export const updateNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required').optional(),
  note_type: noteTypeSchema.optional(),
});

// Contact creation schema
export const createContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required').max(255),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  company: z.string().max(255).optional(),
  position: z.string().max(255).optional(),
  linkedin_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  contact_type: z.enum(['recruiter', 'hiring_manager', 'referral', 'colleague', 'other']).optional(),
  notes: z.string().optional(),
});

export const updateContactSchema = createContactSchema.partial();

// Type inference from schemas
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
