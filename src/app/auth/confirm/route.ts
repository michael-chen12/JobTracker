import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Email Confirmation Route Handler
 *
 * Handles email verification links for:
 * - Signup confirmation (type=signup) → onboarding page
 * - Password recovery (type=recovery) → reset password page
 *
 * Separate from /auth/callback which handles OAuth code exchange.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      if (type === 'signup' || type === 'email') {
        // Email confirmed — upsert user record and go to onboarding
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase.from('users').upsert(
            {
              auth_id: user.id,
              email: user.email!,
              display_name:
                user.user_metadata.display_name ||
                user.email!.split('@')[0],
              photo_url: null,
              role: 'user',
            },
            { onConflict: 'auth_id' }
          );
        }

        return NextResponse.redirect(`${origin}/auth/onboarding`);
      }

      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }

      // Fallback for other OTP types
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
