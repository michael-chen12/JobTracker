import { createClient } from './client';

/**
 * Client-side auth utilities
 * These functions should only be called from Client Components
 */

/**
 * Sign in with Google OAuth
 * Opens OAuth flow and redirects to callback
 */
export async function signInWithGoogle() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign out current user
 * Clears session and cookies
 */
export async function signOut() {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
