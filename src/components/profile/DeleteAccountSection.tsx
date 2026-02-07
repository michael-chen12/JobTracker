'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2, ShieldAlert, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { requestAccountDeletion, cancelAccountDeletion } from '@/actions/gdpr';
import { DELETION_GRACE_PERIOD_DAYS } from '@/schemas/application';
import type { AccountDeletionRequest } from '@/types/application';

interface DeleteAccountSectionProps {
  userEmail: string;
  initialDeletionRequest: AccountDeletionRequest | null;
}

export function DeleteAccountSection({
  userEmail,
  initialDeletionRequest,
}: DeleteAccountSectionProps) {
  const { toast } = useToast();
  const [deletionRequest, setDeletionRequest] = useState<AccountDeletionRequest | null>(
    initialDeletionRequest
  );
  const [showDialog, setShowDialog] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [reason, setReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const emailMatches = confirmEmail.toLowerCase() === userEmail.toLowerCase();

  const handleRequestDeletion = async () => {
    setIsDeleting(true);

    try {
      const result = await requestAccountDeletion({
        confirmation_email: confirmEmail,
        reason: reason || undefined,
      });

      if (result.success) {
        setDeletionRequest(result.data);
        setShowDialog(false);
        setConfirmEmail('');
        setReason('');
        toast({
          title: 'Deletion scheduled',
          description: `Your account will be deleted on ${new Date(result.data.scheduled_deletion_at).toLocaleDateString()}. You can cancel anytime before then.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      }
    } catch (error) {
      console.error('Deletion request error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeletion = async () => {
    setIsCancelling(true);

    try {
      const result = await cancelAccountDeletion();

      if (result.success) {
        setDeletionRequest(null);
        toast({
          title: 'Deletion cancelled',
          description: 'Your account is safe. The deletion request has been cancelled.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      }
    } catch (error) {
      console.error('Cancel deletion error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Calculate days remaining
  const daysRemaining = deletionRequest
    ? Math.max(
        0,
        Math.ceil(
          (new Date(deletionRequest.scheduled_deletion_at).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  // MODE B: Pending deletion
  if (deletionRequest) {
    return (
      <div className="rounded-lg border-2 border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Account scheduled for deletion
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Your account and all data will be permanently deleted on{' '}
                <strong>
                  {new Date(deletionRequest.scheduled_deletion_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </strong>
                . You have <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong>{' '}
                remaining to cancel.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleCancelDeletion}
              disabled={isCancelling}
              className="border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Deletion
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // MODE A: No pending deletion
  return (
    <>
      <div className="rounded-lg border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <Trash2 className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                Delete Account
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                Permanently delete your account and all associated data. This action has a{' '}
                {DELETION_GRACE_PERIOD_DAYS}-day grace period.
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowDialog(true)}
            className="flex-shrink-0 w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Your Account?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This will schedule your account for permanent deletion. After{' '}
                  {DELETION_GRACE_PERIOD_DAYS} days, all your data will be permanently removed
                  including:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>All job applications and notes</li>
                  <li>Uploaded documents and resumes</li>
                  <li>Contacts and correspondence</li>
                  <li>AI analysis data and insights</li>
                </ul>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-500">
                  You can cancel the deletion anytime within the {DELETION_GRACE_PERIOD_DAYS}-day
                  grace period.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="confirm-email" className="text-sm font-medium">
                Type your email to confirm:{' '}
                <span className="font-normal text-gray-500">{userEmail}</span>
              </Label>
              <Input
                id="confirm-email"
                type="email"
                placeholder="Enter your email address"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                disabled={isDeleting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deletion-reason" className="text-sm font-medium">
                Reason for leaving{' '}
                <span className="font-normal text-gray-500">(optional)</span>
              </Label>
              <Textarea
                id="deletion-reason"
                placeholder="Help us improve..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isDeleting}
                rows={2}
                maxLength={500}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => {
                setConfirmEmail('');
                setReason('');
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRequestDeletion();
              }}
              disabled={isDeleting || !emailMatches}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                'Schedule Deletion'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
