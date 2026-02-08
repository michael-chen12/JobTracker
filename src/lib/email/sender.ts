import { createElement } from 'react';
import crypto from 'crypto';
import { getResendClient } from './resend';
import { createAdminClient } from '@/lib/supabase/server';
import { FollowUpReminderEmail } from './templates/FollowUpReminderEmail';
import { WeeklyDigestEmail } from './templates/WeeklyDigestEmail';
import { InterviewNotificationEmail } from './templates/InterviewNotificationEmail';
import { OfferNotificationEmail } from './templates/OfferNotificationEmail';
import type { ExtendedNotificationType } from '@/types/notifications';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Job Tracker <notifications@jobtracker.app>';

interface SendEmailParams {
  userId: string;
  userEmail: string;
  notificationType: ExtendedNotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  notificationId?: string;
}

/**
 * Generate HMAC-SHA256 signed unsubscribe token.
 * Token format: base64url(JSON payload).base64url(HMAC signature)
 */
export function generateUnsubscribeToken(
  userId: string,
  preferenceType: string
): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    throw new Error('UNSUBSCRIBE_SECRET environment variable is not set');
  }

  const payload = {
    user_id: userId,
    type: preferenceType,
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30-day expiry
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', secret).update(payloadStr).digest('base64url');

  return `${payloadStr}.${hmac}`;
}

/**
 * Verify an unsubscribe token and return the payload.
 * Returns null if invalid or expired.
 */
export function verifyUnsubscribeToken(
  token: string
): { user_id: string; type: string; exp: number } | null {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const payloadStr = parts[0];
  const signature = parts[1];
  if (!payloadStr || !signature) return null;

  // Verify HMAC
  const expectedHmac = crypto
    .createHmac('sha256', secret)
    .update(payloadStr)
    .digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac))) {
    return null;
  }

  // Decode and check expiry
  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Map notification type to email preference key for unsubscribe.
 */
function getEmailPreferenceKey(type: ExtendedNotificationType): string | null {
  const map: Partial<Record<ExtendedNotificationType, string>> = {
    follow_up: 'email_follow_up',
    deadline: 'email_deadline',
    interview: 'email_interview',
    offer: 'email_offer',
    weekly_digest: 'email_weekly_digest',
  };
  return map[type] ?? null;
}

/**
 * Send a notification email via Resend with the appropriate React Email template.
 * Non-blocking: errors are logged, never thrown to callers.
 */
export async function sendNotificationEmail(params: SendEmailParams): Promise<void> {
  try {
    const resend = getResendClient();
    const prefKey = getEmailPreferenceKey(params.notificationType);
    if (!prefKey) return; // No email template for this type

    const unsubscribeUrl = `${APP_URL}/api/unsubscribe?token=${generateUnsubscribeToken(params.userId, prefKey)}`;
    const actionUrl = params.actionUrl ? `${APP_URL}${params.actionUrl}` : `${APP_URL}/dashboard`;

    // Select template based on notification type
    let emailElement: React.ReactElement | null = null;
    let subject = params.title;

    switch (params.notificationType) {
      case 'follow_up':
        emailElement = createElement(FollowUpReminderEmail, {
          title: params.title,
          message: params.message,
          actionUrl,
          unsubscribeUrl,
        });
        break;
      case 'interview':
        emailElement = createElement(InterviewNotificationEmail, {
          title: params.title,
          message: params.message,
          actionUrl,
          unsubscribeUrl,
        });
        break;
      case 'offer':
        emailElement = createElement(OfferNotificationEmail, {
          title: params.title,
          message: params.message,
          actionUrl,
          unsubscribeUrl,
        });
        break;
      case 'weekly_digest':
        emailElement = createElement(WeeklyDigestEmail, {
          title: params.title,
          message: params.message,
          actionUrl,
          unsubscribeUrl,
        });
        subject = 'Your Weekly Job Search Digest';
        break;
      default:
        return; // No template for this type
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.userEmail,
      subject,
      react: emailElement,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    if (error) {
      console.error('[email] Resend API error:', error);
      return;
    }

    // Mark email_sent on the notification row
    if (params.notificationId) {
      const adminClient = createAdminClient();
      await adminClient
        .from('notifications')
        .update({ email_sent: true })
        .eq('id', params.notificationId);
    }
  } catch (error) {
    console.error('[email] Failed to send notification email:', error);
  }
}
