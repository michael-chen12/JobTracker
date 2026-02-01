/**
 * InteractionsList Component
 * Ticket #17: Interaction History Tracking
 *
 * List of interactions with empty state
 * Based on NotesList pattern
 */

'use client';

import { InteractionItem } from './InteractionItem';
import type { ContactInteraction } from '@/types/contacts';

interface InteractionsListProps {
  interactions: ContactInteraction[];
  onDelete: (interactionId: string) => Promise<void>;
  deletingInteractionId?: string | null;
}

export function InteractionsList({
  interactions,
  onDelete,
  deletingInteractionId,
}: InteractionsListProps) {
  // Empty state
  if (interactions.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
        <p>No interactions yet.</p>
        <p className="mt-1">Click &quot;Log Interaction&quot; to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {interactions.map((interaction) => (
        <InteractionItem
          key={interaction.id}
          interaction={interaction}
          onDelete={onDelete}
          isDeleting={deletingInteractionId === interaction.id}
        />
      ))}
    </div>
  );
}
