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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { bulkDeleteApplications } from '@/actions/bulk-operations';

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  selectedCount: number;
  onOperationComplete: () => void;
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  selectedIds,
  selectedCount,
  onOperationComplete,
}: BulkDeleteDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (selectedCount > 50) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cannot delete more than 50 applications at once',
      });
      return;
    }

    setIsDeleting(true);

    try {
      const result = await bulkDeleteApplications(selectedIds);

      if (result.success) {
        let message = `${result.successCount} application${result.successCount !== 1 ? 's' : ''} deleted`;
        if (result.failureCount > 0) {
          message += `, ${result.failureCount} failed`;
        }
        toast({
          title: 'Success',
          description: message,
        });
        onOperationComplete();
        onOpenChange(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to delete applications',
        });
      }
    } catch (error) {
      console.error('Error deleting applications:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {selectedCount} Application{selectedCount !== 1 ? 's' : ''}?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete {selectedCount} application{selectedCount !== 1 ? 's' : ''}?
              This action cannot be undone.
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
              handleDelete();
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
  );
}
