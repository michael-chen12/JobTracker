/**
 * Custom comparison functions for React.memo
 * Following Vercel's performance optimization patterns
 */

import type { Contact, ContactWithStats } from '@/types/contacts';
import type { Application } from '@/types/application';

/**
 * Compare contacts by ID and updated_at timestamp
 * Prevents unnecessary re-renders when unrelated props change
 *
 * @example
 * export const ContactCard = React.memo(ContactCardComponent, compareContacts);
 */
export function compareContacts(
  prev: { contact: Contact | ContactWithStats },
  next: { contact: Contact | ContactWithStats }
): boolean {
  // Return true if props are equal (skip re-render)
  return (
    prev.contact.id === next.contact.id &&
    prev.contact.updated_at === next.contact.updated_at
  );
}

/**
 * Compare applications by ID and updated_at timestamp
 *
 * @example
 * export const ApplicationCard = React.memo(ApplicationCardComponent, compareApplications);
 */
export function compareApplications(
  prev: { application: Application },
  next: { application: Application }
): boolean {
  return (
    prev.application.id === next.application.id &&
    prev.application.updated_at === next.application.updated_at
  );
}

/**
 * Generic comparison for items with id and updated_at
 * Useful for list items that follow this pattern
 *
 * @example
 * export const InteractionItem = React.memo(
 *   InteractionItemComponent,
 *   compareById('interaction')
 * );
 */
export function compareById<T extends { id: string; updated_at?: string | null }>(
  propKey: string
) {
  return (prev: Record<string, T>, next: Record<string, T>): boolean => {
    const prevItem = prev[propKey];
    const nextItem = next[propKey];

    if (!prevItem || !nextItem) return false;

    // If no updated_at, compare by ID only
    if (!prevItem.updated_at || !nextItem.updated_at) {
      return prevItem.id === nextItem.id;
    }

    return prevItem.id === nextItem.id && prevItem.updated_at === nextItem.updated_at;
  };
}

/**
 * Shallow comparison for simple props
 * Use when component props are primitives or stable references
 *
 * @example
 * export const StatusBadge = React.memo(StatusBadgeComponent, shallowCompare);
 */
export function shallowCompare<P extends Record<string, any>>(prev: P, next: P): boolean {
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of prevKeys) {
    if (prev[key] !== next[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Deep comparison for array props
 * Useful for components that receive filtered/sorted arrays
 *
 * @example
 * export const ContactsList = React.memo(
 *   ContactsListComponent,
 *   compareArrays('contacts')
 * );
 */
export function compareArrays<T extends { id: string }>(propKey: string) {
  return (prev: Record<string, T[]>, next: Record<string, T[]>): boolean => {
    const prevArray = prev[propKey];
    const nextArray = next[propKey];

    if (!prevArray || !nextArray) return false;
    if (prevArray.length !== nextArray.length) return false;

    // Compare by IDs only (fast check for list changes)
    return prevArray.every((item, index) => item.id === nextArray[index]?.id);
  };
}
