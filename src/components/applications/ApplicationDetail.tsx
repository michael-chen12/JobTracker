'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApplicationWithRelations } from '@/types/application';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ExternalLink,
  Calendar,
  MapPin,
  Briefcase,
  DollarSign,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { NotesSection } from './NotesSection';
import { DocumentsSection } from './DocumentsSection';
import { DeleteApplicationButton } from './DeleteApplicationButton';
import { EditableField } from './EditableField';
import { MatchAnalysisCard } from './MatchAnalysisCard';
import { FollowUpSuggestionsCard } from './FollowUpSuggestionsCard';
import { ContactLinkingSection } from '../contacts/ContactLinkingSection';
import { updateApplication } from '@/actions/applications';
import { useApplicationState } from '@/hooks/useApplicationState';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatSalaryRange } from '@/lib/utils/formatters';
import type { MatchAnalysis, FollowUpSuggestions } from '@/types/ai';
import type { Contact } from '@/types/contacts';

interface ApplicationDetailProps {
  application: ApplicationWithRelations;
  /**
   * Referral contact (fetched by parent server component)
   * Passing as prop avoids useEffect in client component
   */
  referralContact?: Contact | null;
}

/**
 * ApplicationDetail - Comprehensive view of a single job application
 *
 * **Refactored for React best practices:**
 * - Uses useApplicationState reducer (replaces 9 useState calls)
 * - No useEffect for data fetching (referralContact passed as prop)
 * - Stable callbacks with useCallback
 * - Extracted formatters to utilities
 * - Clear separation of concerns
 *
 * **Features:**
 * - Inline editing for all fields
 * - Notes management with summarization
 * - Document attachments
 * - Match analysis and follow-up suggestions
 * - Contact linking
 * - Delete with confirmation
 */
export function ApplicationDetail({ application, referralContact }: ApplicationDetailProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Consolidated state management with reducer
  const { state, actions } = useApplicationState(application);

  // Stable callback for contact linking (refreshes to get updated data)
  const handleContactLinked = useCallback(() => {
    router.refresh();
  }, [router]);

  // Stable callback for field updates
  const handleFieldUpdate = useCallback(
    async (field: string, value: unknown) => {
      try {
        const result = await updateApplication(application.id, {
          [field]: value,
        });

        if (result.error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error,
          });
        } else {
          toast({
            title: 'Updated',
            description: 'Application updated successfully',
          });
          router.refresh();

          // Auto-trigger analysis if job description or URL changed
          const shouldAnalyze =
            (field === 'job_description' || field === 'job_url') &&
            typeof value === 'string' &&
            value.trim().length > 0;

          if (shouldAnalyze) {
            // Analysis will be triggered by MatchAnalysisCard
            // No need to duplicate state management here
          }
        }
      } catch (error) {
        console.error('Failed to update field:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to update application',
        });
      }
    },
    [application.id, router, toast]
  );

  // Stable callback for match analysis completion
  const handleAnalysisComplete = useCallback(
    (score: number, analysis: MatchAnalysis) => {
      actions.setMatchData(score, analysis, new Date().toISOString());
    },
    [actions]
  );

  // Stable callback for follow-up suggestions completion
  const handleSuggestionsComplete = useCallback(
    (suggestions: FollowUpSuggestions) => {
      actions.setSuggestions(suggestions, new Date().toISOString());
    },
    [actions]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link
            href="/dashboard"
            className="hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{application.company}</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {application.position}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {application.company}
              </p>
            </div>
            <DeleteApplicationButton applicationId={application.id} />
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={application.status} />
            {application.job_url && (
              <a
                href={application.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View Job Posting
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Main Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Application Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>Location</span>
                </div>
                <EditableField
                  value={application.location || ''}
                  onSave={(value) => handleFieldUpdate('location', value || null)}
                  placeholder="Add location"
                  type="text"
                />
              </div>

              {/* Job Type */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Briefcase className="h-4 w-4" />
                  <span>Job Type</span>
                </div>
                <EditableField
                  value={application.job_type || ''}
                  onSave={(value) => handleFieldUpdate('job_type', value || null)}
                  placeholder="Add job type"
                  type="select"
                  options={[
                    { label: 'Full-time', value: 'full-time' },
                    { label: 'Part-time', value: 'part-time' },
                    { label: 'Contract', value: 'contract' },
                    { label: 'Internship', value: 'internship' },
                    { label: 'Remote', value: 'remote' },
                  ]}
                />
              </div>

              {/* Applied Date */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>Applied Date</span>
                </div>
                <p className="text-gray-900 dark:text-white">
                  {formatDate(application.applied_date)}
                </p>
              </div>

              {/* Deadline */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>Deadline</span>
                </div>
                <p className="text-gray-900 dark:text-white">
                  {formatDate(application.deadline)}
                </p>
              </div>

              {/* Salary Range */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <DollarSign className="h-4 w-4" />
                  <span>Salary Range</span>
                </div>
                <p className="text-gray-900 dark:text-white">
                  {formatSalaryRange(
                    application.salary_range as { min?: number; max?: number; currency?: string } | null
                  )}
                </p>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Priority</div>
                <EditableField
                  value={application.priority || 'medium'}
                  onSave={(value) => handleFieldUpdate('priority', value)}
                  type="select"
                  options={[
                    { label: 'Low', value: 'low' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'High', value: 'high' },
                  ]}
                />
              </div>

              {/* Source */}
              <div className="space-y-1 md:col-span-2">
                <div className="text-sm text-gray-500 dark:text-gray-400">Source</div>
                <EditableField
                  value={application.source || ''}
                  onSave={(value) => handleFieldUpdate('source', value || null)}
                  placeholder="Where did you find this job?"
                  type="text"
                />
              </div>

              {/* Referral */}
              {application.referral_name && (
                <div className="space-y-1 md:col-span-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Referral</div>
                  <p className="text-gray-900 dark:text-white">{application.referral_name}</p>
                </div>
              )}
            </div>

            {/* Job Description */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Job Description
              </h3>
              <EditableField
                value={application.job_description || ''}
                onSave={(value) => handleFieldUpdate('job_description', value || null)}
                placeholder="Add job description for better match analysis"
                type="textarea"
                rows={10}
              />
            </div>
          </div>
        </div>

        {/* Match Analysis Card */}
        <MatchAnalysisCard
          applicationId={application.id}
          matchScore={state.matchScore}
          matchAnalysis={state.matchAnalysis}
          analyzedAt={state.analyzedAt}
          onAnalysisComplete={handleAnalysisComplete}
          className="mb-6"
        />

        {/* Follow-Up Suggestions Card */}
        <FollowUpSuggestionsCard
          applicationId={application.id}
          appliedDate={application.applied_date}
          followUpSuggestions={state.followUpSuggestions}
          followupSuggestionsAt={state.followupSuggestionsAt}
          onSuggestionsComplete={handleSuggestionsComplete}
          className="mb-6"
        />

        {/* Contact Linking Section */}
        <ContactLinkingSection
          applicationId={application.id}
          referralContact={referralContact || null}
          onContactLinked={handleContactLinked}
        />

        {/* Notes Section */}
        <NotesSection
          applicationId={application.id}
          notes={application.notes || []}
          notesSummary={(application as any).notes_summary}
          summarizedAt={(application as any).summarized_at}
        />

        {/* Documents Section */}
        <DocumentsSection
          applicationId={application.id}
          documents={application.documents || []}
        />
      </div>
    </div>
  );
}
