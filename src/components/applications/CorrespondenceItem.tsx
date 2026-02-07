/**
 * CorrespondenceItem Component
 * Ticket #25: Email Correspondence
 *
 * Individual correspondence entry with expand/collapse and delete
 * Follows InteractionItem pattern with React.memo optimization
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Trash2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatRelativeTime, truncateNote } from '@/lib/utils/noteHelpers';
import { CorrespondenceDirectionBadge } from './CorrespondenceDirectionBadge';
import type { ApplicationCorrespondence, CorrespondenceDirection } from '@/types/application';

interface CorrespondenceItemProps {
  correspondence: ApplicationCorrespondence;
  onDelete: (correspondenceId: string) => Promise<void>;
  isDeleting?: boolean;
}

function compareCorrespondenceItems(
  prev: CorrespondenceItemProps,
  next: CorrespondenceItemProps
): boolean {
  return (
    prev.correspondence.id === next.correspondence.id &&
    prev.isDeleting === next.isDeleting
  );
}

function CorrespondenceItemComponent({
  correspondence,
  onDelete,
  isDeleting = false,
}: CorrespondenceItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { truncated: truncatedNotes, isTruncated } = truncateNote(
    correspondence.notes || '',
    200
  );
  const displayNotes = isExpanded ? correspondence.notes || '' : truncatedNotes;

  const contactLabel =
    correspondence.direction === 'inbound'
      ? `From: ${correspondence.sender}`
      : `To: ${correspondence.recipient || 'Unknown'}`;

  const handleDelete = useCallback(async () => {
    await onDelete(correspondence.id);
    setShowDeleteDialog(false);
  }, [correspondence.id, onDelete]);

  const handleShowDeleteDialog = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setShowDeleteDialog(false);
  }, []);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <>
      <div className="group p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        {/* Header: Direction badge, timestamp, delete button */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <CorrespondenceDirectionBadge
              direction={correspondence.direction as CorrespondenceDirection}
            />
            <time
              className="text-xs text-gray-500 dark:text-gray-400"
              dateTime={correspondence.correspondence_date}
            >
              {formatRelativeTime(correspondence.correspondence_date)}
            </time>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleShowDeleteDialog}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="sr-only">Delete correspondence</span>
          </Button>
        </div>

        {/* Subject line */}
        <div className="flex items-center gap-2 mb-1">
          <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {correspondence.subject}
          </p>
        </div>

        {/* Sender/Recipient */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-6">
          {contactLabel}
        </p>

        {/* Notes (optional) */}
        {correspondence.notes && (
          <>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-2 ml-6">
              {displayNotes}
            </p>
            {isTruncated && (
              <button
                onClick={handleToggleExpand}
                className="mt-1 ml-6 text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Correspondence?</DialogTitle>
            <DialogDescription>
              This will permanently delete &quot;{correspondence.subject}&quot;.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDeleteDialog}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const CorrespondenceItem = React.memo(
  CorrespondenceItemComponent,
  compareCorrespondenceItems
);
