import { createClient } from './client';

/**
 * Client-side auth utilities
 * These functions should only be called from Client Components
 */

// Reliable origin detection — avoids broken redirect URLs when
// NEXT_PUBLIC_APP_URL is missing or misconfigured in .env.local
const getOrigin = () =>
  typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000');

// --- OAuth Providers ---

export async function signInWithGoogle() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${getOrigin()}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}

export async function signInWithGitHub() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${getOrigin()}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}

export async function signInWithLinkedIn() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'linkedin_oidc',
    options: {
      redirectTo: `${getOrigin()}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}

// --- Email/Password ---

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || email.split('@')[0] },
      emailRedirectTo: `${getOrigin()}/auth/confirm`,
    },
  });

  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// --- Password Reset ---

export async function resetPasswordForEmail(email: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getOrigin()}/auth/reset-password`,
  });

  if (error) throw error;
  return data;
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}

// --- Sign Out ---

export async function signOut() {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}
