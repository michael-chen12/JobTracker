/**
 * CorrespondenceList Component
 * Ticket #25: Email Correspondence
 *
 * List of correspondence items with empty state
 */

'use client';

import { Mail } from 'lucide-react';
import { CorrespondenceItem } from './CorrespondenceItem';
import type { ApplicationCorrespondence } from '@/types/application';

interface CorrespondenceListProps {
  correspondence: ApplicationCorrespondence[];
  onDelete: (correspondenceId: string) => Promise<void>;
  deletingId?: string | null;
}

export function CorrespondenceList({
  correspondence,
  onDelete,
  deletingId,
}: CorrespondenceListProps) {
  if (correspondence.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
        <Mail className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p>No correspondence yet.</p>
        <p className="mt-1">Click &quot;Log Email&quot; to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {correspondence.map((item) => (
        <CorrespondenceItem
          key={item.id}
          correspondence={item}
          onDelete={onDelete}
          isDeleting={deletingId === item.id}
        />
      ))}
    </div>
  );
}
