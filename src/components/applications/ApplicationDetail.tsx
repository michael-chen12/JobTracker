'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApplicationWithRelations } from '@/types/application';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  Pencil,
  Trash2,
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
import { updateApplication } from '@/actions/applications';
import { useToast } from '@/hooks/use-toast';
import type { MatchAnalysis } from '@/types/ai';

interface ApplicationDetailProps {
  application: ApplicationWithRelations;
}

/**
 * ApplicationDetail - Comprehensive view of a single job application
 *
 * Features:
 * - Inline editing for all fields
 * - Notes management
 * - Document attachments
 * - Delete with confirmation
 * - Breadcrumb navigation
 */
export function ApplicationDetail({ application }: ApplicationDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [matchScore, setMatchScore] = useState(application.match_score);
  const [matchAnalysis, setMatchAnalysis] = useState(application.match_analysis);

  const handleFieldUpdate = async (field: string, value: unknown) => {
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
      }
    } catch (error) {
      console.error('Failed to update field:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update application',
      });
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatSalaryRange = () => {
    const salary = application.salary_range as { min?: number; max?: number; currency?: string } | null;
    if (!salary) return '—';

    const { min, max, currency = 'USD' } = salary;
    if (!min && !max) return '—';

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`;
    }
    if (min) {
      return `${formatter.format(min)}+`;
    }
    if (max) {
      return `Up to ${formatter.format(max)}`;
    }
    return '—';
  };

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
                <p className="text-gray-900 dark:text-white">{formatSalaryRange()}</p>
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
          matchScore={matchScore}
          matchAnalysis={matchAnalysis as MatchAnalysis | null}
          analyzedAt={application.analyzed_at}
          onAnalysisComplete={(score, analysis) => {
            setMatchScore(score);
            setMatchAnalysis(analysis as any);
          }}
          className="mb-6"
        />

        {/* Notes Section */}
        <NotesSection
          applicationId={application.id}
          notes={application.notes || []}
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
