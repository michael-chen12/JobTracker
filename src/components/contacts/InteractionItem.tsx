/**
 * InteractionItem Component
 * Ticket #17: Interaction History Tracking
 *
 * Individual interaction display with expand/collapse and delete
 *
 * **Optimized for list rendering:**
 * - React.memo with custom comparison (only re-renders when interaction changes)
 * - useCallback for stable event handlers
 * - Efficient state management
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
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
import { InteractionTypeBadge } from './InteractionTypeBadge';
import type { ContactInteraction, InteractionType } from '@/types/contacts';

interface InteractionItemProps {
  interaction: ContactInteraction;
  onDelete: (interactionId: string) => Promise<void>;
  isDeleting?: boolean;
}

/**
 * Custom comparison for InteractionItem
 * Compares interaction by ID (updated_at not available on ContactInteraction)
 */
function compareInteractionItems(
  prev: InteractionItemProps,
  next: InteractionItemProps
): boolean {
  // Only re-render if interaction ID changes or isDeleting state changes
  return (
    prev.interaction.id === next.interaction.id &&
    prev.isDeleting === next.isDeleting
  );
}

/**
 * InteractionItem - Individual interaction display with expand/collapse and delete
 *
 * Optimizations:
 * - Memoized to prevent re-renders when sibling interactions change
 * - Stable callbacks with useCallback
 * - Only updates when interaction data or isDeleting prop changes
 */
function InteractionItemComponent({
  interaction,
  onDelete,
  isDeleting = false,
}: InteractionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Truncate notes if longer than 200 chars
  const { truncated, isTruncated } = truncateNote(
    interaction.notes || 'No notes',
    200
  );
  const displayContent = isExpanded
    ? interaction.notes || 'No notes'
    : truncated;

  // Stable callbacks
  const handleDelete = useCallback(async () => {
    await onDelete(interaction.id);
    setShowDeleteDialog(false);
  }, [interaction.id, onDelete]);

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
        {/* Header: Type badge, timestamp, delete button */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <InteractionTypeBadge type={interaction.interaction_type as InteractionType} />
            <time
              className="text-xs text-gray-500 dark:text-gray-400"
              dateTime={interaction.interaction_date}
            >
              {formatRelativeTime(interaction.interaction_date)}
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
            <span className="sr-only">Delete interaction</span>
          </Button>
        </div>

        {/* Content */}
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {displayContent}
        </p>

        {/* Expand/Collapse toggle */}
        {isTruncated && (
          <button
            onClick={handleToggleExpand}
            className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Interaction?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The interaction will be permanently
              deleted.
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

/**
 * Memoized InteractionItem - only re-renders when interaction data changes
 * Uses custom comparison function specific to InteractionItemProps
 */
export const InteractionItem = React.memo(
  InteractionItemComponent,
  compareInteractionItems
);
