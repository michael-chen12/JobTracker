import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  getPasswordStrength,
  PASSWORD_MIN_LENGTH,
  HAS_UPPERCASE,
  HAS_LOWERCASE,
  HAS_NUMBER,
} from '@/schemas/auth';

// --- Password Strength ---

describe('getPasswordStrength', () => {
  it('returns weak for empty string', () => {
    expect(getPasswordStrength('')).toBe('weak');
  });

  it('returns weak when only 1 rule met (short lowercase)', () => {
    expect(getPasswordStrength('abc')).toBe('weak');
  });

  it('returns fair when 2 rules met (lowercase + number, but short)', () => {
    expect(getPasswordStrength('abc1')).toBe('fair');
  });

  it('returns fair when 2 rules met (long lowercase)', () => {
    expect(getPasswordStrength('abcdefgh')).toBe('fair');
  });

  it('returns good when 3 rules met (long + upper + lower)', () => {
    expect(getPasswordStrength('Abcdefgh')).toBe('good');
  });

  it('returns good when 3 rules met (long + lower + number)', () => {
    expect(getPasswordStrength('abcdefg1')).toBe('good');
  });

  it('returns strong when all 4 rules met', () => {
    expect(getPasswordStrength('Abcdefg1')).toBe('strong');
  });

  it('returns strong for complex password', () => {
    expect(getPasswordStrength('MyP4ssword!')).toBe('strong');
  });
});

// --- Password Constants ---

describe('password constants', () => {
  it('PASSWORD_MIN_LENGTH is 8', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
  });

  it('HAS_UPPERCASE matches uppercase letters', () => {
    expect(HAS_UPPERCASE.test('A')).toBe(true);
    expect(HAS_UPPERCASE.test('a')).toBe(false);
    expect(HAS_UPPERCASE.test('1')).toBe(false);
  });

  it('HAS_LOWERCASE matches lowercase letters', () => {
    expect(HAS_LOWERCASE.test('a')).toBe(true);
    expect(HAS_LOWERCASE.test('A')).toBe(false);
    expect(HAS_LOWERCASE.test('1')).toBe(false);
  });

  it('HAS_NUMBER matches digits', () => {
    expect(HAS_NUMBER.test('1')).toBe(true);
    expect(HAS_NUMBER.test('a')).toBe(false);
    expect(HAS_NUMBER.test('A')).toBe(false);
  });
});

// --- Login Schema ---

describe('loginSchema', () => {
  it('validates a correct login', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing email', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts any non-empty password (no strength check on login)', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'a',
    });
    expect(result.success).toBe(true);
  });
});

// --- Register Schema ---

describe('registerSchema', () => {
  const validData = {
    email: 'user@example.com',
    password: 'Abcdefg1',
    confirmPassword: 'Abcdefg1',
  };

  it('validates a correct registration', () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('accepts optional displayName', () => {
    const result = registerSchema.safeParse({
      ...validData,
      displayName: 'John Doe',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBe('John Doe');
    }
  });

  it('trims display name and converts empty to undefined', () => {
    const result = registerSchema.safeParse({
      ...validData,
      displayName: '   ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBeUndefined();
    }
  });

  it('allows missing displayName', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'Abcdefg1',
      confirmPassword: 'Abcdefg1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'Abc1',
      confirmPassword: 'Abc1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes('at least 8'))).toBe(true);
    }
  });

  it('rejects password without uppercase', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'abcdefg1',
      confirmPassword: 'abcdefg1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes('uppercase'))).toBe(true);
    }
  });

  it('rejects password without lowercase', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'ABCDEFG1',
      confirmPassword: 'ABCDEFG1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes('lowercase'))).toBe(true);
    }
  });

  it('rejects password without a number', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'Abcdefgh',
      confirmPassword: 'Abcdefgh',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes('number'))).toBe(true);
    }
  });

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      ...validData,
      confirmPassword: 'Different1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes('do not match'))).toBe(true);
    }
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      ...validData,
      email: 'bad-email',
    });
    expect(result.success).toBe(false);
  });

  it('rejects display name over 100 characters', () => {
    const result = registerSchema.safeParse({
      ...validData,
      displayName: 'A'.repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

// --- Forgot Password Schema ---

describe('forgotPasswordSchema', () => {
  it('validates a correct email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'user@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty email', () => {
    const result = forgotPasswordSchema.safeParse({ email: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'not-email' });
    expect(result.success).toBe(false);
  });
});

// --- Reset Password Schema ---

describe('resetPasswordSchema', () => {
  it('validates matching strong passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'NewPass1x',
      confirmPassword: 'NewPass1x',
    });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'NewPass1x',
      confirmPassword: 'WrongOne1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes('do not match'))).toBe(true);
    }
  });

  it('rejects weak password (too short)', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Ab1',
      confirmPassword: 'Ab1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without uppercase', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'abcdefg1',
      confirmPassword: 'abcdefg1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without number', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Abcdefgh',
      confirmPassword: 'Abcdefgh',
    });
    expect(result.success).toBe(false);
  });
});
