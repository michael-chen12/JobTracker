'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createNoteSchema, type CreateNoteInput } from '@/schemas/application';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getNoteTypeColors, type NoteType } from '@/lib/utils/noteHelpers';

interface AddNoteFormProps {
  applicationId: string;
  onNoteCreated: (note: CreateNoteInput) => Promise<void>;
  onCancel: () => void;
}

const noteTypes: NoteType[] = ['general', 'interview', 'follow-up', 'research', 'contact'];

/**
 * AddNoteForm - Inline form for creating notes
 */
export function AddNoteForm({ applicationId, onNoteCreated, onCancel }: AddNoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateNoteInput>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      application_id: applicationId,
      content: '',
      note_type: 'general',
    },
  });

  const contentLength = form.watch('content')?.length || 0;
  const showCharCount = contentLength > 1800;
  const maxChars = 2000;

  const onSubmit = async (data: CreateNoteInput) => {
    setIsSubmitting(true);
    try {
      await onNoteCreated(data);
      form.reset();
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="note_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Note Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {noteTypes.map((type) => {
                      const config = getNoteTypeColors(type);
                      return (
                        <SelectItem key={type} value={type}>
                          <span className="flex items-center gap-2">
                            <span>{config.icon}</span>
                            <span>{config.label}</span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Note</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Type your note here..."
                    rows={3}
                    maxLength={maxChars}
                    {...field}
                    autoFocus
                  />
                </FormControl>
                {showCharCount && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                    {contentLength} / {maxChars}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Note'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
