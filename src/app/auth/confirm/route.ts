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
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');
  const nextPath = nextParam?.startsWith('/') ? nextParam : null;

  const supabase = await createClient();

  let authError: Error | null = null;

  // Support both link styles:
  // 1) token_hash + type (OTP verification)
  // 2) code (PKCE auth-code exchange)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    authError = error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  } else {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  if (authError) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const { error: upsertError } = await supabase.from('users').upsert(
    {
      auth_id: user.id,
      email: user.email,
      display_name:
        user.user_metadata.display_name ||
        user.user_metadata.full_name ||
        user.user_metadata.name ||
        user.email.split('@')[0],
      photo_url:
        user.user_metadata.avatar_url ||
        user.user_metadata.picture ||
        null,
      role: 'user',
    },
    { onConflict: 'auth_id' }
  );

  if (upsertError) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (!existingUser) {
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }
  }

  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/auth/reset-password`);
  }

  if (nextPath) {
    return NextResponse.redirect(`${origin}${nextPath}`);
  }

  if (type === 'signup' || type === 'email' || code) {
    return NextResponse.redirect(`${origin}/auth/onboarding`);
  }

  // Fallback for other OTP types
  return NextResponse.redirect(`${origin}/dashboard`);
}
