'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createApplicationSchema, type CreateApplicationInput } from '@/schemas/application';
import { createApplication } from '@/actions/applications';
import { analyzeJobMatch } from '@/actions/analyze-job';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { FormSection } from './FormSection';
import { TwoColumnRow } from './TwoColumnRow';
import { SalaryRangeInput } from './SalaryRangeInput';
import { ChevronRight, Loader2 } from 'lucide-react';
import { CelebrationModal } from '@/components/achievements/CelebrationModal';
import type { CelebrationData } from '@/types/achievements';

interface ApplicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * ApplicationFormDialog - Main form for creating job applications
 *
 * Features:
 * - Progressive disclosure with collapsible additional details
 * - Smart defaults (applied_date = today, status = applied)
 * - Optimistic UI updates
 * - Toast notifications for success/error feedback
 * - Full accessibility support
 */
export function ApplicationFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: ApplicationFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalDetailsOpen, setAdditionalDetailsOpen] = useState(false);
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);

  // Initialize form with React Hook Form + Zod validation
  const form = useForm<CreateApplicationInput>({
    resolver: zodResolver(createApplicationSchema),
    defaultValues: {
      company: '',
      position: '',
      status: 'applied',
      applied_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
      priority: 'medium',
      job_type: undefined, // Will be converted to empty string in Select value prop
      location: '',
      job_url: '',
      job_description: '',
      source: '',
      referral_name: '',
      deadline: '',
      salary_range: {
        currency: 'USD',
      },
    },
  });

  // Handle form submission
  const onSubmit = async (data: CreateApplicationInput) => {
    console.log('=== Form Submit Started ===');
    console.log('Form data:', data);
    setIsSubmitting(true);

    // Show creating toast immediately
    const creatingToast = toast({
      title: 'Creating application...',
      description: 'Please wait a moment',
    });

    try {
      // Clean data: convert empty strings to undefined for optional fields
      const cleanedData = {
        ...data,
        applied_date: data.applied_date || undefined,
        deadline: data.deadline || undefined,
        location: data.location || undefined,
        job_url: data.job_url || undefined,
        job_description: data.job_description || undefined,
        source: data.source || undefined,
        referral_name: data.referral_name || undefined,
        job_type: data.job_type || undefined,
        // Only include salary_range if at least one value is present
        salary_range:
          data.salary_range?.min || data.salary_range?.max
            ? data.salary_range
            : undefined,
      };

      // Call server action to create application
      console.log('Calling createApplication server action...');
      const result = await createApplication(cleanedData);
      console.log('Server action result:', result);

      if (result.error) {
        console.log('Error case - showing error toast');
        // Dismiss creating toast and show error
        creatingToast.dismiss();
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else {
        console.log('Success case - showing success toast');
        // Dismiss creating toast and show success
        creatingToast.dismiss();
        toast({
          title: 'Success',
          description: 'Application created successfully',
        });

        // Trigger celebration if achievements were unlocked
        if ('data' in result && result.celebrationData && result.celebrationData.length > 0) {
          const celebration = result.celebrationData[0];
          if (celebration) {
            console.log('Celebration triggered!', celebration);
            setCelebrationData(celebration); // Show first celebration
          }
        }

        // Auto-trigger job analysis if job info exists
        const hasJobInfo = cleanedData.job_url || cleanedData.job_description;
        if (hasJobInfo && result.data?.id) {
          const analysisToastId = toast({
            title: 'Analyzing job match...',
            description: 'This may take 10-15 seconds',
          });

          // Run analysis in background (don't await)
          analyzeJobMatch(result.data.id)
            .then((analysisResult) => {
              if (analysisResult.success && analysisResult.score !== undefined) {
                toast({
                  title: `Match score: ${analysisResult.score}%`,
                  description: 'View details in the application page',
                });
              } else if (analysisResult.error) {
                // Only show error toast if it's not a rate limit or missing info error
                const errorMessage = analysisResult.error.toLowerCase();
                const isExpectedError =
                  errorMessage.includes('rate limit') ||
                  errorMessage.includes('manual') ||
                  errorMessage.includes('profile');

                if (!isExpectedError) {
                  toast({
                    variant: 'destructive',
                    title: 'Analysis failed',
                    description: analysisResult.error,
                  });
                }
              }
            })
            .catch((error) => {
              console.error('Analysis error:', error);
              toast({
                variant: 'destructive',
                title: 'Analysis failed',
                description: 'You can re-analyze from the application page.',
              });
            });
        }

        // Reset form
        form.reset();

        // Close dialog
        onOpenChange(false);

        // Call success callback after a delay to avoid updating during render
        setTimeout(() => {
          onSuccess?.();
        }, 0);
      }
    } catch (error) {
      console.log('Caught exception:', error);
      // Dismiss creating toast and show error
      creatingToast.dismiss();
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create application. Please try again.',
      });
      console.error('Failed to create application:', error);
    } finally {
      setIsSubmitting(false);
      console.log('=== Form Submit Completed ===');
    }
  };

  // Handle dialog close with form dirty check
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && form.formState.isDirty) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }
    onOpenChange(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  return (
    <>
      {/* Celebration modal (rendered outside main dialog) */}
      <CelebrationModal
        celebrationData={celebrationData}
        onClose={() => setCelebrationData(null)}
      />

      {/* Main application form dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
        <DialogHeader>
          <DialogTitle>Create Application</DialogTitle>
          <DialogDescription>
            Add a new job application to track your job search progress.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            autoComplete="off"
          >
            {/* ESSENTIAL INFORMATION */}
            <FormSection label="Essential Information">
              {/* Company Name */}
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Company Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Google, Microsoft"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Position Title */}
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Position Title <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Senior Software Engineer"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status and Applied Date */}
              <TwoColumnRow>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bookmarked">Bookmarked</SelectItem>
                          <SelectItem value="applied">Applied</SelectItem>
                          <SelectItem value="screening">Screening</SelectItem>
                          <SelectItem value="interviewing">Interviewing</SelectItem>
                          <SelectItem value="offer">Offer</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="withdrawn">Withdrawn</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="applied_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Applied Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TwoColumnRow>
            </FormSection>

            {/* JOB DETAILS */}
            <FormSection label="Job Details">
              {/* Job Description */}
              <FormField
                control={form.control}
                name="job_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the job description here (optional but recommended for AI features)"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Job URL */}
              <FormField
                control={form.control}
                name="job_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://company.com/careers/job-id"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location and Job Type */}
              <TwoColumnRow>
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., San Francisco, CA or Remote"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="job_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                          <SelectItem value="remote">Remote</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TwoColumnRow>
            </FormSection>

            {/* ADDITIONAL DETAILS (Collapsible) */}
            <Collapsible
              open={additionalDetailsOpen}
              onOpenChange={setAdditionalDetailsOpen}
            >
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    additionalDetailsOpen ? 'rotate-90' : ''
                  }`}
                />
                {additionalDetailsOpen ? 'Hide' : 'Show'} Additional Details (7 optional fields)
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-4 space-y-4">
                {/* Salary Range */}
                <SalaryRangeInput form={form} />

                {/* Deadline and Priority */}
                <TwoColumnRow>
                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deadline</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TwoColumnRow>

                {/* Source */}
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., LinkedIn, Indeed, Company website"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Referral Name */}
                <FormField
                  control={form.control}
                  name="referral_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referral Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Who referred you to this position?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Dialog Footer with Actions */}
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? 'Creating...' : 'Create Application'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}
