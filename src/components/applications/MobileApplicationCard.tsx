'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, Calendar } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useSwipeToReveal } from '@/hooks/useSwipeToReveal';
import { deleteApplication } from '@/actions/applications';
import { StatusBadge } from './StatusBadge';
import type { ApplicationRow } from './columns';

interface MobileApplicationCardProps {
  application: ApplicationRow;
  onDeleted?: () => void;
}

function MobileApplicationCardComponent({
  application,
  onDeleted,
}: MobileApplicationCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { handlers, offset, close } = useSwipeToReveal({
    threshold: 80,
  });

  const handleTap = useCallback(() => {
    // Only navigate if not mid-swipe
    if (Math.abs(offset) < 5) {
      router.push(`/dashboard/applications/${application.id}`);
    }
  }, [router, application.id, offset]);

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setConfirmOpen(true);
    },
    []
  );

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const result = await deleteApplication(application.id);
      if ('success' in result) {
        toast({
          title: 'Deleted',
          description: `${application.company} — ${application.position} removed`,
        });
        close();
        onDeleted?.();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to delete application',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  }, [application.id, application.company, application.position, close, onDeleted, toast]);

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <div className="relative overflow-hidden" data-testid="mobile-application-card">
        {/* Delete zone — behind the card */}
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center">
          <button
            onClick={handleDeleteClick}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] text-white"
            aria-label={`Delete ${application.company} application`}
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>

        {/* Card content — slides left on swipe */}
        <div
          {...handlers}
          onClick={handleTap}
          role="button"
          tabIndex={0}
          aria-label={`View ${application.company} ${application.position} details`}
          className="relative bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50 transition-transform duration-150 ease-out touch-pan-y"
          style={{ transform: `translateX(${offset}px)`, touchAction: 'pan-y' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 dark:text-white truncate">
                {application.company}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {application.position}
              </p>
            </div>
            <StatusBadge status={application.status} />
          </div>
          {application.applied_date && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>Applied {formatDate(application.applied_date)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete{' '}
                <span className="font-medium">
                  {application.company} — {application.position}
                </span>
                ? This action cannot be undone.
              </p>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-500">
                This will also delete all associated notes, documents, and milestones.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const MobileApplicationCard = React.memo(MobileApplicationCardComponent);
