/**
 * Contact Validation Schemas
 * Ticket #16: Contact Management CRUD
 *
 * Zod validation schemas for contact forms and inputs
 * Includes strict security validation to prevent XSS/SSRF attacks
 */

import { z } from 'zod';

// =============================================
// VALIDATION HELPERS
// =============================================

/**
 * Strict LinkedIn URL validation (Security Fix)
 *
 * SECURITY: Only allows valid LinkedIn profile URLs to prevent:
 * - XSS attacks (javascript:, data: protocols)
 * - SSRF attacks (arbitrary domains)
 * - Path traversal (only /in/* paths allowed)
 *
 * Valid formats:
 * - https://linkedin.com/in/username
 * - https://www.linkedin.com/in/username
 * - https://linkedin.com/in/username/
 * - https://www.linkedin.com/in/username-with-dashes-123/
 *
 * Invalid formats:
 * - javascript:alert(1)
 * - data:text/html,<script>alert(1)</script>
 * - https://evil.com
 * - http://linkedin.com (no HTTP, only HTTPS)
 * - https://linkedin.com/company/... (only /in/ paths)
 */
const linkedInUrlSchema = z
  .string()
  .optional()
  .refine(
    (url) => {
      // Empty or undefined is allowed (optional field)
      if (!url || url.trim() === '') return true;

      try {
        const parsed = new URL(url);

        // 1. Protocol must be HTTPS
        if (parsed.protocol !== 'https:') {
          return false;
        }

        // 2. Hostname must be linkedin.com or www.linkedin.com
        const validHosts = ['linkedin.com', 'www.linkedin.com'];
        if (!validHosts.includes(parsed.hostname)) {
          return false;
        }

        // 3. Path must start with /in/
        if (!parsed.pathname.startsWith('/in/')) {
          return false;
        }

        // 4. Path must have a username after /in/
        const pathParts = parsed.pathname.split('/').filter(Boolean);
        if (pathParts.length < 2 || pathParts[0] !== 'in') {
          return false;
        }

        return true;
      } catch {
        // Invalid URL format
        return false;
      }
    },
    {
      message:
        'Invalid LinkedIn URL. Must be in format: https://linkedin.com/in/username',
    }
  );

/**
 * Email validation (RFC 5322 basic validation)
 *
 * More permissive than strict RFC 5322 but prevents common issues:
 * - Must have @ symbol
 * - Must have domain with at least one dot
 * - No spaces
 */
const emailSchema = z
  .string()
  .optional()
  .refine(
    (email) => {
      if (!email || email.trim() === '') return true;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
    {
      message: 'Invalid email format',
    }
  );

/**
 * Phone validation (international format support)
 *
 * Allows:
 * - US format: (123) 456-7890, 123-456-7890
 * - International: +1 234 567 8900
 * - Minimum 10 digits
 */
const phoneSchema = z
  .string()
  .optional()
  .refine(
    (phone) => {
      if (!phone || phone.trim() === '') return true;

      // Remove common separators to count digits
      const digitsOnly = phone.replace(/[\s\-\(\)\+]/g, '');

      // Must have at least 10 digits
      if (digitsOnly.length < 10) {
        return false;
      }

      // Must contain only digits and common separators
      const validChars = /^[\d\s\-\(\)\+]+$/;
      return validChars.test(phone);
    },
    {
      message: 'Invalid phone number. Must be at least 10 digits',
    }
  );

// =============================================
// MAIN SCHEMAS
// =============================================

/**
 * Contact form schema (for create/edit dialogs)
 *
 * Validates all contact fields with appropriate constraints:
 * - name: Required, 1-100 characters
 * - email: Optional, valid email format
 * - phone: Optional, valid phone format
 * - company: Optional, max 100 characters
 * - position: Optional, max 100 characters
 * - linkedin_url: Optional, strict LinkedIn URL validation
 * - contact_type: Optional, one of enum values
 * - notes: Optional, max 1000 characters
 * - tags: Optional, array of strings
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Contact name is required')
    .max(100, 'Name must be 100 characters or less')
    .transform((val) => val.trim()),

  email: emailSchema.transform((val) => (val ? val.trim().toLowerCase() : '')),

  phone: phoneSchema.transform((val) => (val ? val.trim() : '')),

  company: z
    .string()
    .max(100, 'Company name must be 100 characters or less')
    .optional()
    .transform((val) => (val ? val.trim() : '')),

  position: z
    .string()
    .max(100, 'Position must be 100 characters or less')
    .optional()
    .transform((val) => (val ? val.trim() : '')),

  linkedin_url: linkedInUrlSchema.transform((val) => (val ? val.trim() : '')),

  contact_type: z
    .enum(['recruiter', 'hiring_manager', 'referral', 'colleague', 'other'])
    .optional(),

  notes: z
    .string()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional()
    .transform((val) => (val ? val.trim() : '')),

  tags: z.array(z.string()).optional().default([]),
});

/**
 * Update contact schema (partial updates)
 *
 * All fields optional except those explicitly required
 * Allows partial updates without requiring all fields
 */
export const updateContactSchema = contactFormSchema.partial().extend({
  id: z.string().uuid('Invalid contact ID'),
});

/**
 * Contact linking schema (for linking contacts to applications)
 */
export const linkContactSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID'),
  contactId: z.string().uuid('Invalid contact ID'),
});

/**
 * Contact interaction schema (for logging emails, calls, meetings)
 */
export const contactInteractionSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID'),

  interactionType: z.enum([
    'email',
    'call',
    'meeting',
    'linkedin_message',
    'other',
  ]),

  interactionDate: z
    .string()
    .datetime('Invalid date format. Use ISO 8601 format')
    .optional()
    .default(() => new Date().toISOString()),

  notes: z
    .string()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional()
    .transform((val) => (val ? val.trim() : '')),
});

/**
 * Contact search/filter schema (for validating query parameters)
 */
export const contactSearchSchema = z.object({
  search: z.string().optional(),
  contactType: z
    .enum(['recruiter', 'hiring_manager', 'referral', 'colleague', 'other'])
    .optional(),
  tags: z.array(z.string()).optional(),
  company: z.string().optional(),
  sortField: z
    .enum(['name', 'company', 'last_interaction_date', 'created_at'])
    .optional()
    .default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
});

// =============================================
// TYPE EXPORTS (inferred from schemas)
// =============================================

export type ContactFormData = z.infer<typeof contactFormSchema>;
export type UpdateContactData = z.infer<typeof updateContactSchema>;
export type LinkContactData = z.infer<typeof linkContactSchema>;
export type ContactInteractionData = z.infer<typeof contactInteractionSchema>;
export type ContactSearchData = z.infer<typeof contactSearchSchema>;
