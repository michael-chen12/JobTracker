'use client';

import { NoteItem } from './NoteItem';
import type { NoteType } from '@/lib/utils/noteHelpers';

interface Note {
  id: string;
  application_id: string;
  content: string;
  note_type: NoteType;
  created_at: string;
  updated_at: string;
}

interface NotesListProps {
  applicationId: string;
  notes: Note[];
  onNoteDeleted: (noteId: string) => Promise<void>;
  deletingNoteId: string | null;
}

/**
 * NotesList - Display all notes in chronological order
 */
export function NotesList({ notes, onNoteDeleted, deletingNoteId }: NotesListProps) {
  if (notes.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-4xl mb-2">📝</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
          No notes yet
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Add your first note to track important details about this application.
        </p>
      </div>
    );
  }

  // Sort notes by created_at descending (newest first)
  const sortedNotes = [...notes].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-3">
      {sortedNotes.map((note) => (
        <NoteItem
          key={note.id}
          note={note}
          onDelete={onNoteDeleted}
          isDeleting={deletingNoteId === note.id}
        />
      ))}
    </div>
  );
}
