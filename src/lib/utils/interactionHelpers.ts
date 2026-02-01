/**
 * Utility functions for interaction formatting and display
 * Ticket #17: Interaction History Tracking
 */

import type { InteractionType, RelationshipStrength } from '@/types/contacts';

/**
 * Get color classes and icons for interaction type badges
 */
export function getInteractionTypeColors(type: InteractionType) {
  const colors = {
    email: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-300 dark:border-blue-600',
      icon: '📧',
      label: 'Email',
    },
    call: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      border: 'border-green-300 dark:border-green-600',
      icon: '📞',
      label: 'Call',
    },
    meeting: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-300 dark:border-purple-600',
      icon: '🤝',
      label: 'Meeting',
    },
    linkedin_message: {
      bg: 'bg-sky-100 dark:bg-sky-900/30',
      text: 'text-sky-700 dark:text-sky-400',
      border: 'border-sky-300 dark:border-sky-600',
      icon: '💼',
      label: 'LinkedIn',
    },
    other: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-300 dark:border-gray-600',
      icon: '💬',
      label: 'Other',
    },
  };

  return colors[type];
}

/**
 * Get color classes and icons for relationship strength badges
 */
export function getRelationshipStrengthColors(strength: RelationshipStrength) {
  const colors = {
    cold: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      icon: '❄️',
      label: 'Cold',
    },
    warm: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: '🔥',
      label: 'Warm',
    },
    strong: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      icon: '💪',
      label: 'Strong',
    },
  };

  return colors[strength];
}

/**
 * Re-export formatRelativeTime from noteHelpers
 * (DRY: same logic for interaction timestamps)
 */
export { formatRelativeTime } from './noteHelpers';
