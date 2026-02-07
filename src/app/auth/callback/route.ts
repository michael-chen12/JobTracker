import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * OAuth Callback Route Handler
 *
 * Handles the OAuth redirect from Supabase Auth for all providers
 * (Google, GitHub, LinkedIn). Exchanges the authorization code for
 * a session and upserts the user record.
 *
 * Flow:
 * 1. User clicks OAuth provider button
 * 2. Redirected to provider consent screen
 * 3. Provider redirects back here with authorization code
 * 4. Exchange code for session
 * 5. Upsert user in DB
 * 6. Redirect to dashboard
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Extract display name — each provider uses different metadata fields
        const displayName =
          user.user_metadata.full_name ||
          user.user_metadata.name ||
          user.user_metadata.display_name ||
          user.email!.split('@')[0];

        // Extract avatar — Google/GitHub use avatar_url, LinkedIn uses picture
        const photoUrl =
          user.user_metadata.avatar_url ||
          user.user_metadata.picture ||
          null;

        await supabase.from('users').upsert(
          {
            auth_id: user.id,
            email: user.email!,
            display_name: displayName,
            photo_url: photoUrl,
            role: 'user',
          },
          { onConflict: 'auth_id' }
        );
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=authentication_failed`);
}
