'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Ensures a user record exists in the `users` table for the currently
 * authenticated session. Safe to call on every login — uses upsert so it
 * never creates duplicates.
 *
 * This is a defensive fallback for cases where the email confirmation route
 * (/auth/confirm) did not run — e.g. broken emailRedirectTo configuration —
 * which would otherwise leave the auth user with no matching DB record and
 * cause "User not found" errors throughout the app.
 */
export async function ensureUserRecord(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase.from('users').upsert(
    {
      auth_id: user.id,
      email: user.email!,
      display_name:
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email!.split('@')[0],
      photo_url:
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        null,
      role: 'user',
    },
    { onConflict: 'auth_id' }
  );

  if (error) return { success: false, error: error.message };
  return { success: true };
}