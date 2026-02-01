/**
 * AddInteractionForm Component
 * Ticket #17: Interaction History Tracking
 *
 * Inline form for creating interaction records
 * Based on AddNoteForm pattern from src/components/notes/AddNoteForm.tsx
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  contactInteractionSchema,
  type ContactInteractionData,
} from '@/schemas/contact';
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
import { Input } from '@/components/ui/input';
import { getInteractionTypeColors } from '@/lib/utils/interactionHelpers';
import type { InteractionType } from '@/types/contacts';

interface AddInteractionFormProps {
  contactId: string;
  onSubmit: (data: ContactInteractionData) => Promise<void>;
  onCancel: () => void;
}

const interactionTypes: InteractionType[] = [
  'email',
  'call',
  'meeting',
  'linkedin_message',
  'other',
];

/**
 * AddInteractionForm - Inline form for creating interaction records
 */
export function AddInteractionForm({
  contactId,
  onSubmit,
  onCancel,
}: AddInteractionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default date to today (in local timezone, YYYY-MM-DD format)
  const today = new Date();
  const defaultDate = today.toISOString().split('T')[0]; // Format: "2026-02-01"

  const form = useForm<ContactInteractionData>({
    resolver: zodResolver(contactInteractionSchema),
    defaultValues: {
      contactId,
      interactionType: 'email',
      interactionDate: new Date().toISOString(), // Default to now
      notes: '',
    },
  });

  const notesLength = form.watch('notes')?.length || 0;
  const showCharCount = notesLength > 800;
  const maxChars = 1000;

  const handleSubmit = async (data: ContactInteractionData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error('Failed to create interaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
          {/* Interaction Type */}
          <FormField
            control={form.control}
            name="interactionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {interactionTypes.map((type) => {
                      const config = getInteractionTypeColors(type);
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

          {/* Interaction Date */}
          <FormField
            control={form.control}
            name="interactionDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    max={defaultDate} // Prevent future dates
                    defaultValue={defaultDate}
                    onChange={(e) => {
                      // Convert date input (YYYY-MM-DD) to ISO 8601 timestamp
                      const dateValue = e.target.value;
                      if (dateValue) {
                        const timestamp = new Date(
                          dateValue + 'T00:00:00'
                        ).toISOString();
                        field.onChange(timestamp);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Notes (Optional)
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., Discussed job opportunity, sent follow-up email..."
                    rows={3}
                    maxLength={maxChars}
                    {...field}
                  />
                </FormControl>
                {showCharCount && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                    {notesLength} / {maxChars}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Actions */}
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
              {isSubmitting ? 'Logging...' : 'Log Interaction'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
