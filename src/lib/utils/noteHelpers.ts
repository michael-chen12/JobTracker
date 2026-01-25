/**
 * Utility functions for note formatting and display
 */

export type NoteType = 'general' | 'interview' | 'follow-up' | 'research' | 'contact';

/**
 * Get color classes for note type badges
 */
export function getNoteTypeColors(type: NoteType) {
  const colors = {
    general: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-300 dark:border-gray-600',
      icon: '📝',
      label: 'General',
    },
    interview: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-300 dark:border-blue-600',
      icon: '👔',
      label: 'Interview',
    },
    'follow-up': {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      border: 'border-yellow-300 dark:border-yellow-600',
      icon: '📧',
      label: 'Follow-up',
    },
    research: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-300 dark:border-purple-600',
      icon: '🔍',
      label: 'Research',
    },
    contact: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      border: 'border-green-300 dark:border-green-600',
      icon: '👤',
      label: 'Contact',
    },
  };

  return colors[type];
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    // Format as "MMM D, YYYY" for dates older than 7 days
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  }
}

/**
 * Truncate note content to specified length
 */
export function truncateNote(content: string, maxLength = 200): {
  truncated: string;
  isTruncated: boolean;
} {
  if (content.length <= maxLength) {
    return { truncated: content, isTruncated: false };
  }

  // Find the last space before maxLength to avoid cutting words
  const truncateAt = content.lastIndexOf(' ', maxLength);
  const finalLength = truncateAt > 0 ? truncateAt : maxLength;

  return {
    truncated: content.substring(0, finalLength) + '...',
    isTruncated: true,
  };
}
