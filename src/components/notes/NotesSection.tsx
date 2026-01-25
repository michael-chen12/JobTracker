'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { createNote, deleteNote } from '@/actions/applications';
import { type CreateNoteInput } from '@/schemas/application';
import { NotesList } from './NotesList';
import { AddNoteForm } from './AddNoteForm';
import type { NoteType } from '@/lib/utils/noteHelpers';

interface Note {
  id: string;
  application_id: string;
  content: string;
  note_type: NoteType;
  created_at: string;
  updated_at: string;
}

interface NotesSectionProps {
  applicationId: string;
  initialNotes: Note[];
  compact?: boolean;
}

/**
 * NotesSection - Main orchestrator for notes functionality
 * Handles collapsible section, add form, and optimistic updates
 */
export function NotesSection({
  applicationId,
  initialNotes,
  compact = true,
}: NotesSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleNoteCreated = async (data: CreateNoteInput) => {
    // Optimistic update
    const tempNote: Note = {
      id: crypto.randomUUID(),
      application_id: data.application_id,
      content: data.content,
      note_type: data.note_type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setNotes((prev) => [tempNote, ...prev]);
    setShowAddForm(false);

    // Server action
    const result = await createNote(data);

    if (result.error) {
      // Rollback on error
      setNotes((prev) => prev.filter((n) => n.id !== tempNote.id));
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
      setShowAddForm(true);
    } else {
      // Replace temp note with real note
      setNotes((prev) =>
        prev.map((n) => (n.id === tempNote.id ? result.data! : n))
      );
      toast({
        title: 'Success',
        description: 'Note created successfully',
      });
      router.refresh();
    }
  };

  const handleNoteDeleted = async (noteId: string) => {
    setDeletingNoteId(noteId);

    // Optimistic update
    const deletedNote = notes.find((n) => n.id === noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));

    // Server action
    const result = await deleteNote(noteId, applicationId);

    setDeletingNoteId(null);

    if (result.error) {
      // Rollback on error
      if (deletedNote) {
        setNotes((prev) => [...prev, deletedNote]);
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else {
      toast({
        title: 'Success',
        description: 'Note deleted successfully',
      });
      router.refresh();
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-3">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ChevronRight
            className={`h-4 w-4 transition-transform ${
              isOpen ? 'rotate-90' : ''
            }`}
          />
          <span>Notes</span>
          {notes.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {notes.length}
            </Badge>
          )}
        </CollapsibleTrigger>

        {isOpen && !showAddForm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="h-8 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        )}
      </div>

      <CollapsibleContent className="mt-3 space-y-3">
        {showAddForm && (
          <AddNoteForm
            applicationId={applicationId}
            onNoteCreated={handleNoteCreated}
            onCancel={handleCancel}
          />
        )}

        <NotesList
          applicationId={applicationId}
          notes={notes}
          onNoteDeleted={handleNoteDeleted}
          deletingNoteId={deletingNoteId}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
