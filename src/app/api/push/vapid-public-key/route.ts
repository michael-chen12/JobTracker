import { NextResponse } from 'next/server';

/**
 * GET /api/push/vapid-public-key
 * Returns the VAPID public key for client-side push subscription.
 * This key is safe to expose publicly.
 */
export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return NextResponse.json(
      { error: 'Push notifications not configured' },
      { status: 503 }
    );
  }

  return NextResponse.json({ publicKey });
}
