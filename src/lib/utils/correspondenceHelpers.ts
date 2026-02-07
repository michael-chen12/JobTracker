/**
 * Utility functions for correspondence formatting and display
 * Ticket #25: Email Correspondence (Manual-First Approach)
 */

import type { CorrespondenceDirection } from '@/types/application';

/**
 * Get color classes and icons for correspondence direction badges
 */
export function getDirectionConfig(direction: CorrespondenceDirection) {
  const configs = {
    inbound: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-300 dark:border-blue-600',
      icon: '📥',
      label: 'Received',
    },
    outbound: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      border: 'border-green-300 dark:border-green-600',
      icon: '📤',
      label: 'Sent',
    },
  };

  return configs[direction];
}

/**
 * Re-export formatRelativeTime for correspondence timestamps
 */
export { formatRelativeTime } from './noteHelpers';
