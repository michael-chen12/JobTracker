import { useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

/**
 * Discriminated union return type (preferred)
 */
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Simple return type (legacy server actions)
 */
type SimpleActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Combined action result type - supports both patterns
 */
type CombinedActionResult<T> = ActionResult<T> | SimpleActionResult;

interface UseOptimisticActionOptions<T, R> {
  /**
   * The async action to execute
   * Supports both discriminated union and simple result types
   */
  action: (data: T) => Promise<CombinedActionResult<R>>;

  /**
   * Optimistic update function - called immediately before action
   */
  onOptimistic?: (data: T) => void;

  /**
   * Rollback function - called if action fails
   */
  onRollback?: () => void;

  /**
   * Success callback - called after successful action
   */
  onSuccess?: (result?: R) => void;

  /**
   * Success toast message
   */
  successMessage?: string;

  /**
   * Error toast message (falls back to error from action)
   */
  errorMessage?: string;

  /**
   * Whether to refresh router after success
   */
  refreshOnSuccess?: boolean;
}

/**
 * Hook for handling optimistic updates with rollback
 *
 * @example
 * const deleteContact = useOptimisticAction({
 *   action: (id) => deleteContactAction(id),
 *   onOptimistic: (id) => setContacts(prev => prev.filter(c => c.id !== id)),
 *   onRollback: () => setContacts(originalContacts),
 *   successMessage: 'Contact deleted',
 *   refreshOnSuccess: true,
 * });
 *
 * // Usage
 * await deleteContact(contactId);
 */
export function useOptimisticAction<T, R = void>({
  action,
  onOptimistic,
  onRollback,
  onSuccess,
  successMessage,
  errorMessage,
  refreshOnSuccess = false,
}: UseOptimisticActionOptions<T, R>) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const execute = useCallback(
    async (data: T) => {
      // Apply optimistic update immediately
      if (onOptimistic) {
        startTransition(() => {
          onOptimistic(data);
        });
      }

      try {
        const result = await action(data);

        if (result.success) {
          // Success - call success callback
          if (onSuccess) {
            // Handle both discriminated union and simple result types
            const data = 'data' in result ? result.data : undefined;
            onSuccess(data);
          }

          // Show success toast
          if (successMessage) {
            toast({
              title: successMessage,
            });
          }

          // Refresh router if needed
          if (refreshOnSuccess) {
            router.refresh();
          }

          return result as ActionResult<R>;
        } else {
          // Action failed - rollback optimistic update
          if (onRollback) {
            startTransition(() => {
              onRollback();
            });
          }

          // Show error toast
          const errorMsg = 'error' in result ? result.error : 'Action failed';
          toast({
            variant: 'destructive',
            title: 'Error',
            description: errorMessage || errorMsg,
          });

          return { success: false as const, error: errorMsg || 'Action failed' };
        }
      } catch (error) {
        // Unexpected error - rollback
        if (onRollback) {
          startTransition(() => {
            onRollback();
          });
        }

        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMessage || message,
        });

        return { success: false as const, error: message };
      }
    },
    [action, onOptimistic, onRollback, onSuccess, successMessage, errorMessage, refreshOnSuccess, router, toast]
  );

  return {
    execute,
    isPending,
  };
}
