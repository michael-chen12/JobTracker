import { z } from 'zod';
import type { PasswordStrength } from '@/types/auth';

// --- Password validation constants ---
export const PASSWORD_MIN_LENGTH = 8;
export const HAS_UPPERCASE = /[A-Z]/;
export const HAS_LOWERCASE = /[a-z]/;
export const HAS_NUMBER = /[0-9]/;

// --- Password strength utility ---
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 'weak';

  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score++;
  if (HAS_UPPERCASE.test(password)) score++;
  if (HAS_LOWERCASE.test(password)) score++;
  if (HAS_NUMBER.test(password)) score++;

  if (score <= 1) return 'weak';
  if (score === 2) return 'fair';
  if (score === 3) return 'good';
  return 'strong';
}

// --- Password field schema (reused across register + reset) ---
const passwordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .regex(HAS_UPPERCASE, 'Password must contain at least one uppercase letter')
  .regex(HAS_LOWERCASE, 'Password must contain at least one lowercase letter')
  .regex(HAS_NUMBER, 'Password must contain at least one number');

// --- Schemas ---

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .max(100, 'Display name must be under 100 characters')
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        const trimmed = val.trim();
        return trimmed || undefined;
      }),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
    password: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
});

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// --- Inferred types ---
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
