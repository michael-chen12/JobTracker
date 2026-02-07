/**
 * Formatting utilities for consistent data display
 * Extracted from components for reusability and testability
 */

/**
 * Format a date string to a human-readable format
 *
 * @param date - ISO date string or null
 * @param fallback - Fallback value if date is null (default: '—')
 * @returns Formatted date string
 *
 * @example
 * formatDate('2024-01-15T00:00:00Z') // 'January 15, 2024'
 * formatDate(null) // '—'
 */
export function formatDate(date: string | null, fallback = '—'): string {
  if (!date) return fallback;
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a salary range object to a currency string
 *
 * @param salary - Salary range object with min, max, and optional currency
 * @param fallback - Fallback value if no salary (default: '—')
 * @returns Formatted salary string
 *
 * @example
 * formatSalaryRange({ min: 100000, max: 150000, currency: 'USD' })
 * // '$100,000 - $150,000'
 *
 * formatSalaryRange({ min: 100000, currency: 'USD' })
 * // '$100,000+'
 *
 * formatSalaryRange({ max: 150000, currency: 'USD' })
 * // 'Up to $150,000'
 */
export function formatSalaryRange(
  salary: { min?: number; max?: number; currency?: string } | null,
  fallback = '—'
): string {
  if (!salary) return fallback;

  const { min, max, currency = 'USD' } = salary;
  if (!min && !max) return fallback;

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }
  if (min) {
    return `${formatter.format(min)}+`;
  }
  if (max) {
    return `Up to ${formatter.format(max)}`;
  }
  return fallback;
}

/**
 * Format a relative time string (e.g., "2 hours ago", "yesterday")
 *
 * @param date - ISO date string
 * @returns Relative time string
 *
 * @example
 * formatRelativeTime('2024-01-15T12:00:00Z') // '2 days ago'
 */
export function formatRelativeTime(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }

  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  }

  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }

  // For older dates, use absolute format
  return formatDate(date);
}

/**
 * Format a number as a percentage
 *
 * @param value - Number to format (0-100)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 *
 * @example
 * formatPercentage(85.5) // '86%'
 * formatPercentage(85.5, 1) // '85.5%'
 */
export function formatPercentage(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format file size in bytes to human-readable string
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB", "340 KB")
 *
 * @example
 * formatFileSize(2621440) // '2.5 MB'
 * formatFileSize(348160) // '340.0 KB'
 * formatFileSize(0) // '0 B'
 */
export function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Truncate a string to a maximum length with ellipsis
 *
 * @param text - String to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated string
 *
 * @example
 * truncate('This is a long text', 10) // 'This is a...'
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
