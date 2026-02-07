/**
 * AddCorrespondenceForm Component
 * Ticket #25: Email Correspondence
 *
 * Form for manually logging email correspondence
 * Labels adapt based on direction (inbound/outbound)
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { createCorrespondenceSchema, type CreateCorrespondenceInput } from '@/schemas/application';
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
import { getDirectionConfig } from '@/lib/utils/correspondenceHelpers';
import type { CorrespondenceDirection } from '@/types/application';

interface AddCorrespondenceFormProps {
  applicationId: string;
  userEmail?: string;
  onSubmit: (data: CreateCorrespondenceInput) => Promise<void>;
  onCancel: () => void;
}

const directions: CorrespondenceDirection[] = ['inbound', 'outbound'];

export function AddCorrespondenceForm({
  applicationId,
  userEmail,
  onSubmit,
  onCancel,
}: AddCorrespondenceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const form = useForm<CreateCorrespondenceInput>({
    resolver: zodResolver(createCorrespondenceSchema),
    defaultValues: {
      application_id: applicationId,
      direction: 'inbound',
      subject: '',
      sender: '',
      recipient: '',
      correspondence_date: new Date().toISOString(),
      notes: '',
    },
  });

  const direction = form.watch('direction');
  const notesLength = form.watch('notes')?.length || 0;
  const showCharCount = notesLength > 1600;
  const maxChars = 2000;

  // Auto-fill sender with user email when direction changes to outbound
  useEffect(() => {
    if (direction === 'outbound' && userEmail) {
      form.setValue('sender', userEmail);
    } else if (direction === 'inbound') {
      form.setValue('sender', '');
    }
  }, [direction, userEmail, form]);

  const handleSubmit = async (data: CreateCorrespondenceInput) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error('Failed to create correspondence:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
          {/* Direction */}
          <FormField
            control={form.control}
            name="direction"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Direction</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {directions.map((dir) => {
                      const config = getDirectionConfig(dir);
                      return (
                        <SelectItem key={dir} value={dir}>
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

          {/* Subject */}
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Subject</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Interview Invitation - Software Engineer"
                    maxLength={500}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Sender / Recipient row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Sender */}
            <FormField
              control={form.control}
              name="sender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {direction === 'inbound' ? 'From' : 'From (You)'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        direction === 'inbound'
                          ? 'recruiter@company.com'
                          : userEmail || 'your@email.com'
                      }
                      maxLength={255}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recipient */}
            <FormField
              control={form.control}
              name="recipient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {direction === 'inbound' ? 'To (Optional)' : 'To'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        direction === 'inbound'
                          ? 'your@email.com'
                          : 'recruiter@company.com'
                      }
                      maxLength={255}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Date */}
          <FormField
            control={form.control}
            name="correspondence_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    defaultValue={today}
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      if (dateValue) {
                        const timestamp = new Date(dateValue + 'T00:00:00').toISOString();
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
                    placeholder="e.g., Discussed next steps, asked about salary range..."
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
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging...
                </>
              ) : (
                'Log Email'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
