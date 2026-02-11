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
  min: z.number().min(0).optional(),
  max: z.number().min(0).optional(),
  currency: z.string().length(3).default('USD'), // ISO 4217 currency code (USD, EUR, etc.)
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
  applied_date: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  deadline: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
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

// Tag creation schema
export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, 'Tag name required')
    .max(50, 'Max 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Letters, numbers, spaces, hyphens, underscores only'),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color')
    .default('#3B82F6'),
});

export const updateTagSchema = createTagSchema.partial();

// Document type validation
export const documentTypeSchema = z.enum([
  'resume',
  'cover_letter',
  'portfolio',
  'transcript',
  'correspondence',
  'other',
]);

// Document upload validation schema
export const uploadDocumentSchema = z.object({
  application_id: z.string().uuid('Invalid application ID'),
  document_type: documentTypeSchema.default('other'),
});

// File validation constants
export const DOCUMENT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
export const DOCUMENT_MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total per application
export const DOCUMENT_ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
] as const;

export const DOCUMENT_ACCEPTED_EXTENSIONS = '.pdf,.docx,.txt,.jpg,.jpeg,.png';

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  resume: 'Resume',
  cover_letter: 'Cover Letter',
  portfolio: 'Portfolio',
  transcript: 'Transcript',
  correspondence: 'Correspondence',
  other: 'Other',
};

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

// Correspondence validation (Ticket #25)
export const correspondenceDirectionSchema = z.enum(['inbound', 'outbound']);

export const createCorrespondenceSchema = z.object({
  application_id: z.string().uuid('Invalid application ID'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(500, 'Subject must be 500 characters or less'),
  sender: z
    .string()
    .min(1, 'Sender is required')
    .max(255, 'Sender must be 255 characters or less'),
  recipient: z
    .string()
    .max(255, 'Recipient must be 255 characters or less')
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  direction: correspondenceDirectionSchema,
  correspondence_date: z
    .string()
    .datetime('Invalid date format')
    .optional()
    .default(() => new Date().toISOString()),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .optional()
    .transform((val) => (val ? val.trim() : undefined)),
});

export const CORRESPONDENCE_DIRECTION_LABELS: Record<string, string> = {
  inbound: 'Received',
  outbound: 'Sent',
};

export type CreateCorrespondenceInput = z.infer<typeof createCorrespondenceSchema>;

// Data Export validation (Ticket #26: Export & GDPR Compliance)
export const exportTypeSchema = z.enum(['json', 'csv']);

export const requestDataExportSchema = z.object({
  export_type: exportTypeSchema,
});

export type RequestDataExportInput = z.infer<typeof requestDataExportSchema>;

// Account Deletion validation (Ticket #26: Export & GDPR Compliance)
export const requestAccountDeletionSchema = z.object({
  confirmation_email: z.string().email('Must be a valid email'),
  reason: z
    .string()
    .max(500, 'Reason must be 500 characters or less')
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const trimmed = val.trim();
      return trimmed || undefined;
    }),
});

export type RequestAccountDeletionInput = z.infer<typeof requestAccountDeletionSchema>;

export const DELETION_GRACE_PERIOD_DAYS = 30;

// Type inference from schemas
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;

// Import validation (Ticket #33: ATS Imports)
export const IMPORT_MAX_ROWS = 500;
export const IMPORT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const importSourceSchema = z.enum(['linkedin', 'indeed', 'greenhouse', 'generic_csv']);

export const greenhouseImportSchema = z.object({
  api_key: z.string().min(1, 'Greenhouse API key is required').max(200).transform((v) => v.trim()),
  company_name: z
    .string()
    .min(1, 'Company name is required')
    .max(255)
    .transform((v) => v.trim()),
});

export type GreenhouseImportInput = z.infer<typeof greenhouseImportSchema>;
