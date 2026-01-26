import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const resumeUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      'File must be PDF or DOCX format'
    ),
  size: z
    .number()
    .max(MAX_FILE_SIZE, `File size must be less than 5MB`),
});

export type ResumeUpload = z.infer<typeof resumeUploadSchema>;
