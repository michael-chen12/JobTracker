'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatRelativeTime, getNoteTypeColors, truncateNote, type NoteType } from '@/lib/utils/noteHelpers';

interface Note {
  id: string;
  application_id: string;
  content: string;
  note_type: NoteType;
  created_at: string;
  updated_at: string;
}

interface NoteItemProps {
  note: Note;
  onDelete: (noteId: string) => Promise<void>;
  isDeleting?: boolean;
}

/**
 * NoteItem - Individual note display with expand/collapse and delete
 */
export function NoteItem({ note, onDelete, isDeleting = false }: NoteItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const noteTypeConfig = getNoteTypeColors(note.note_type);
  const { truncated, isTruncated } = truncateNote(note.content);
  const displayContent = isExpanded ? note.content : truncated;

  const handleDelete = async () => {
    await onDelete(note.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="group p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        {/* Header: Type badge, timestamp, delete button */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={`${noteTypeConfig.bg} ${noteTypeConfig.text} text-xs font-medium`}
            >
              <span className="mr-1">{noteTypeConfig.icon}</span>
              {noteTypeConfig.label}
            </Badge>
            <time
              className="text-xs text-gray-500 dark:text-gray-400"
              dateTime={note.created_at}
            >
              {formatRelativeTime(note.created_at)}
            </time>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="sr-only">Delete note</span>
          </Button>
        </div>

        {/* Content */}
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {displayContent}
        </p>

        {/* Expand/Collapse toggle */}
        {isTruncated && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
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
            <DialogTitle>Delete Note?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The note will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
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
