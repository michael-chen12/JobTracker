import { createClient } from './client';
import { createClient as createServerClient } from './server';

/**
 * Sign in with Google OAuth
 * Opens OAuth flow in new window/redirect
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

/**
 * Get current user from server context
 * Returns null if not authenticated
 */
export async function getUser() {
  const supabase = await createServerClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
}

/**
 * Get current session from server context
 * Returns null if no active session
 */
export async function getSession() {
  const supabase = await createServerClient();

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    return null;
  }

  return session;
}
