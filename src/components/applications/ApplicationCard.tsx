'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationRow } from './columns';
import { StatusBadge } from './StatusBadge';
import { MatchScoreBadge } from './MatchScoreBadge';
import { ReferralBadge } from './ReferralBadge';
import { Calendar, MapPin } from 'lucide-react';
interface ApplicationCardProps {
  application: ApplicationRow;
}

/**
 * Custom comparison for ApplicationCard
 * Compares by ID, updated_at, match_score, and referral to prevent unnecessary re-renders
 */
function compareApplicationCards(
  prev: ApplicationCardProps,
  next: ApplicationCardProps
): boolean {
  return (
    prev.application.id === next.application.id &&
    prev.application.updated_at === next.application.updated_at &&
    prev.application.match_score === next.application.match_score &&
    prev.application.referral_contact_id === next.application.referral_contact_id
  );
}

/**
 * ApplicationCard - Card view for kanban board
 *
 * **Optimized for list rendering:**
 * - React.memo with custom comparison (only re-renders when application data changes)
 * - useCallback for stable event handlers
 * - Extracted formatDate to inline helper (simple enough to keep local)
 *
 * Used in:
 * - Kanban board columns
 * - Application list views
 */
function ApplicationCardComponent({ application }: ApplicationCardProps) {
  const router = useRouter();

  // Stable navigation callback
  const handleClick = useCallback(() => {
    router.push(`/dashboard/applications/${application.id}`);
  }, [router, application.id]);

  // Stable stop propagation callback for match score badge
  const handleBadgeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      onClick={handleClick}
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
        <div className="mb-3" onClick={handleBadgeClick}>
          <MatchScoreBadge
            applicationId={application.id}
            matchScore={application.match_score}
          />
        </div>
      )}

      {/* Referral Badge */}
      {application.referral_contact_id && (
        <div className="mb-3">
          <ReferralBadge
            contactId={application.referral_contact_id}
            size="sm"
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

/**
 * Memoized ApplicationCard - only re-renders when application data changes
 * Uses custom comparison function specific to ApplicationRow
 */
export const ApplicationCard = React.memo(ApplicationCardComponent, compareApplicationCards);
