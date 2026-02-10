export type AuthErrorContext = 'sign_up' | 'sign_in' | 'password_reset';

function extractCooldown(message: string): string | null {
  const lower = message.toLowerCase();

  const seconds = lower.match(/after\s+(\d+)\s+seconds?/i);
  if (seconds?.[1]) {
    return `${seconds[1]} second${seconds[1] === '1' ? '' : 's'}`;
  }

  const minutes = lower.match(/after\s+(\d+)\s+minutes?/i);
  if (minutes?.[1]) {
    return `${minutes[1]} minute${minutes[1] === '1' ? '' : 's'}`;
  }

  const hours = lower.match(/after\s+(\d+)\s+hours?/i);
  if (hours?.[1]) {
    return `${hours[1]} hour${hours[1] === '1' ? '' : 's'}`;
  }

  return null;
}

function isRateLimitError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('over_email_send_rate_limit') ||
    lower.includes('for security purposes, you can only request this after')
  );
}

export function toFriendlyAuthError(
  rawMessage: string,
  context: AuthErrorContext
): string {
  const cooldown = extractCooldown(rawMessage);

  if (isRateLimitError(rawMessage)) {
    if (context === 'sign_up') {
      return cooldown
        ? `Too many confirmation emails were requested. Please wait ${cooldown} and try again.`
        : 'Too many confirmation emails were requested. Please wait a few minutes and try again.';
    }

    if (context === 'password_reset') {
      return cooldown
        ? `Too many reset emails were requested. Please wait ${cooldown} and try again.`
        : 'Too many reset emails were requested. Please wait a few minutes and try again.';
    }

    return cooldown
      ? `Too many sign-in attempts. Please wait ${cooldown} and try again.`
      : 'Too many sign-in attempts. Please wait a few minutes and try again.';
  }

  return rawMessage;
}
