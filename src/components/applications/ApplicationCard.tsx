'use client';

import { useRouter } from 'next/navigation';
import { ApplicationRow } from './columns';
import { StatusBadge } from './StatusBadge';
import { MatchScoreBadge } from './MatchScoreBadge';
import { Calendar, MapPin } from 'lucide-react';

interface ApplicationCardProps {
  application: ApplicationRow;
}

/**
 * ApplicationCard - Card view for kanban board
 */
export function ApplicationCard({ application }: ApplicationCardProps) {
  const router = useRouter();

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      onClick={() => router.push(`/dashboard/applications/${application.id}`)}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Company & Position */}
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
        {application.company}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {application.position}
      </p>

      {/* Match Score Badge */}
      {(application.match_score !== null || application.job_description || application.job_url) && (
        <div className="mb-3" onClick={(e) => e.stopPropagation()}>
          <MatchScoreBadge
            applicationId={application.id}
            matchScore={application.match_score}
          />
        </div>
      )}

      {/* Metadata */}
      <div className="space-y-2 text-xs text-gray-500 dark:text-gray-500">
        {application.location && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{application.location}</span>
          </div>
        )}
        {application.applied_date && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Applied {formatDate(application.applied_date)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
