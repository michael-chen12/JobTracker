import { NextRequest, NextResponse } from 'next/server';
import { verifyUnsubscribeToken } from '@/lib/email/sender';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/unsubscribe?token=...
 * One-click email unsubscribe. Token is self-authenticating (HMAC-SHA256 signed).
 * No auth required — the signed token proves ownership.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return new NextResponse(renderHTML('Missing Token', 'No unsubscribe token provided.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const payload = verifyUnsubscribeToken(token);

  if (!payload) {
    return new NextResponse(
      renderHTML('Invalid or Expired Link', 'This unsubscribe link has expired or is invalid. Please update your preferences from your profile settings.'),
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    const adminClient = createAdminClient();

    // Update the specific email preference to false
    const { error } = await adminClient
      .from('notification_preferences')
      .update({ [payload.type]: false })
      .eq('user_id', payload.user_id);

    if (error) {
      console.error('Unsubscribe update error:', error);
      return new NextResponse(
        renderHTML('Error', 'Failed to update your preferences. Please try again from your profile settings.'),
        { status: 500, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const typeLabel = payload.type
      .replace('email_', '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

    return new NextResponse(
      renderHTML(
        'Unsubscribed',
        `You have been unsubscribed from ${typeLabel} email notifications. You can re-enable them anytime from your profile settings.`
      ),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('Unsubscribe exception:', error);
    return new NextResponse(
      renderHTML('Error', 'An unexpected error occurred. Please try again later.'),
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

function renderHTML(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Job Tracker</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f6f9fc; }
    .card { background: white; border-radius: 12px; padding: 48px; max-width: 480px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 12px; }
    p { color: #4a4a4a; font-size: 15px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
