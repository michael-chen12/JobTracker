'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { bulkUpdateStatus } from '@/actions/bulk-operations';
import { BulkDeleteDialog } from './BulkDeleteDialog';

interface BulkActionsToolbarProps {
  selectedIds: string[];
  selectedCount: number;
  onClearSelection: () => void;
  onOperationComplete: () => void;
}

export function BulkActionsToolbar({
  selectedIds,
  selectedCount,
  onClearSelection,
  onOperationComplete,
}: BulkActionsToolbarProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (selectedCount > 50) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cannot update more than 50 applications at once',
      });
      return;
    }

    setIsUpdating(true);

    try {
      const result = await bulkUpdateStatus(selectedIds, newStatus);

      if (result.success) {
        let message = `${result.successCount} application${result.successCount !== 1 ? 's' : ''} updated`;
        if (result.failureCount > 0) {
          message += `, ${result.failureCount} failed`;
        }
        toast({
          title: 'Success',
          description: message,
        });
        onOperationComplete();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to update applications',
        });
      }
    } catch (error) {
      console.error('Error updating applications:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
            {selectedCount} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <Select
            onValueChange={handleStatusChange}
            disabled={isUpdating || selectedCount > 50}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-9">
              <SelectValue placeholder="Change status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bookmarked">Bookmarked</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="screening">Screening</SelectItem>
              <SelectItem value="interviewing">Interviewing</SelectItem>
              <SelectItem value="offer">Offer</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isUpdating || selectedCount > 50}
            className="w-full sm:w-auto"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </>
            )}
          </Button>
        </div>

        {selectedCount > 50 && (
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
            Cannot perform bulk operations on more than 50 applications
          </p>
        )}
      </div>

      <BulkDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        selectedIds={selectedIds}
        selectedCount={selectedCount}
        onOperationComplete={onOperationComplete}
      />
    </>
  );
}
