import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * OAuth Callback Route Handler
 *
 * This route handles the OAuth redirect from Supabase Auth.
 * It exchanges the authorization code for a session and redirects to the dashboard.
 *
 * Flow:
 * 1. User clicks "Sign in with Google"
 * 2. Redirected to Google OAuth consent screen
 * 3. Google redirects back to this route with authorization code
 * 4. We exchange code for session
 * 5. Redirect to dashboard
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();

    // Exchange authorization code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if user record exists in our users table
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        // Create user record if it doesn't exist (first-time login)
        if (!existingUser) {
          await supabase.from('users').insert({
            auth_id: user.id,
            email: user.email!,
            display_name: user.user_metadata.full_name || user.email!.split('@')[0],
            photo_url: user.user_metadata.avatar_url,
            role: 'user',
          });
        }
      }

      // Successful authentication - redirect to dashboard
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Authentication failed - redirect to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=authentication_failed`);
}
