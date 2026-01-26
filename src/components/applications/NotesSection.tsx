'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationNote } from '@/types/application';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { createNote, deleteNote } from '@/actions/applications';
import { useToast } from '@/hooks/use-toast';

interface NotesSectionProps {
  applicationId: string;
  notes: ApplicationNote[];
}

/**
 * NotesSection - Chronological notes display with add/delete functionality
 */
export function NotesSection({ applicationId, notes }: NotesSectionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Note content cannot be empty',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createNote({
        application_id: applicationId,
        content: newNoteContent,
        note_type: 'general',
      });

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else {
        toast({
          title: 'Note Added',
          description: 'Your note has been saved',
        });
        setNewNoteContent('');
        setIsAdding(false);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to add note:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add note',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const result = await deleteNote(noteId, applicationId);

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else {
        toast({
          title: 'Note Deleted',
          description: 'Your note has been removed',
        });
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete note',
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Sort notes by most recent first
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notes
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({notes.length})
            </span>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Note
            </Button>
          )}
        </div>

        {/* Add Note Form */}
        {isAdding && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <Textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Add your note here..."
              rows={3}
              className="mb-2"
              autoFocus
            />
            <div className="flex gap-2">
              <Button onClick={handleAddNote} size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Note'}
              </Button>
              <Button
                onClick={() => {
                  setIsAdding(false);
                  setNewNoteContent('');
                }}
                size="sm"
                variant="outline"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Notes List */}
        {sortedNotes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No notes yet. Add your first note to track important information.
          </p>
        ) : (
          <div className="space-y-4">
            {sortedNotes.map((note) => (
              <div
                key={note.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(note.created_at)}
                  </span>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
