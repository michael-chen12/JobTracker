/**
 * CorrespondenceSection Component
 * Ticket #25: Email Correspondence (Manual-First Approach)
 *
 * Main orchestrator for email correspondence on application detail page
 * Handles collapsible section, add form, filters, and optimistic updates
 * Follows InteractionsSection + DocumentsSection patterns
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Plus, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import {
  createCorrespondence,
  deleteCorrespondence,
} from '@/actions/correspondence';
import { CorrespondenceList } from './CorrespondenceList';
import { AddCorrespondenceForm } from './AddCorrespondenceForm';
import {
  CorrespondenceFilters,
  type CorrespondenceFiltersState,
} from './CorrespondenceFilters';
import type {
  ApplicationCorrespondence,
  CorrespondenceDirection,
} from '@/types/application';
import type { CreateCorrespondenceInput } from '@/schemas/application';

interface CorrespondenceSectionProps {
  applicationId: string;
  correspondence: ApplicationCorrespondence[];
  userEmail?: string;
}

/**
 * Apply client-side filters to correspondence list
 */
function applyFilters(
  items: ApplicationCorrespondence[],
  filters: CorrespondenceFiltersState
): ApplicationCorrespondence[] {
  let filtered = [...items];

  // Filter by direction
  if (filters.directions && filters.directions.length > 0) {
    filtered = filtered.filter((item) =>
      filters.directions.includes(item.direction as CorrespondenceDirection)
    );
  }

  // Filter by date range
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    filtered = filtered.filter(
      (item) => new Date(item.correspondence_date) >= fromDate
    );
  }

  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    filtered = filtered.filter(
      (item) => new Date(item.correspondence_date) <= toDate
    );
  }

  return filtered;
}

export function CorrespondenceSection({
  applicationId,
  correspondence: initialCorrespondence,
  userEmail,
}: CorrespondenceSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [correspondence, setCorrespondence] =
    useState<ApplicationCorrespondence[]>(initialCorrespondence);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<CorrespondenceFiltersState>({
    directions: [],
    dateFrom: undefined,
    dateTo: undefined,
  });
  const { toast } = useToast();
  const router = useRouter();

  const filteredCorrespondence = useMemo(
    () => applyFilters(correspondence, filters),
    [correspondence, filters]
  );

  // Optimistic create
  const handleCreate = useCallback(
    async (data: CreateCorrespondenceInput) => {
      const tempItem: ApplicationCorrespondence = {
        id: crypto.randomUUID(),
        application_id: data.application_id,
        subject: data.subject,
        sender: data.sender,
        recipient: data.recipient ?? null,
        direction: data.direction,
        correspondence_date: data.correspondence_date ?? new Date().toISOString(),
        notes: data.notes ?? null,
        gmail_message_id: null,
        gmail_thread_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistic: add to list
      setCorrespondence((prev) => [tempItem, ...prev]);
      setShowAddForm(false);

      const result = await createCorrespondence(data);

      if (!result.success) {
        // Rollback
        setCorrespondence((prev) => prev.filter((c) => c.id !== tempItem.id));
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
        setShowAddForm(true);
      } else {
        // Replace temp with real record
        setCorrespondence((prev) =>
          prev.map((c) => (c.id === tempItem.id ? result.data : c))
        );
        toast({
          title: 'Success',
          description: 'Correspondence logged successfully',
        });
        router.refresh();
      }
    },
    [toast, router]
  );

  // Optimistic delete
  const handleDelete = useCallback(
    async (correspondenceId: string) => {
      setDeletingId(correspondenceId);

      const deletedItem = correspondence.find((c) => c.id === correspondenceId);
      setCorrespondence((prev) => prev.filter((c) => c.id !== correspondenceId));

      const result = await deleteCorrespondence(correspondenceId, applicationId);

      setDeletingId(null);

      if (!result.success) {
        // Rollback
        if (deletedItem) {
          setCorrespondence((prev) =>
            [...prev, deletedItem].sort(
              (a, b) =>
                new Date(b.correspondence_date).getTime() -
                new Date(a.correspondence_date).getTime()
            )
          );
        }
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Correspondence deleted',
        });
        router.refresh();
      }
    },
    [applicationId, correspondence, toast, router]
  );

  const handleCancel = useCallback(() => {
    setShowAddForm(false);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              <ChevronRight
                className={`h-5 w-5 transition-transform ${
                  isOpen ? 'rotate-90' : ''
                }`}
              />
              <Mail className="h-5 w-5" />
              <span>Correspondence</span>
              {correspondence.length > 0 && (
                <Badge variant="secondary" className="text-sm">
                  {filteredCorrespondence.length}
                  {filteredCorrespondence.length !== correspondence.length &&
                    ` / ${correspondence.length}`}
                </Badge>
              )}
            </CollapsibleTrigger>

            {isOpen && (
              <div className="flex items-center gap-2">
                {/* Sync Now placeholder (disabled for future Gmail integration) */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button variant="outline" size="sm" disabled className="gap-1">
                          <RefreshCw className="h-4 w-4" />
                          <span className="hidden sm:inline">Sync</span>
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Gmail sync coming soon</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {!showAddForm && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowAddForm(true)}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Log Email
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-6 pb-6 space-y-4">
            {/* Filters */}
            <CorrespondenceFilters
              filters={filters}
              onFiltersChange={setFilters}
            />

            {/* Add Form */}
            {showAddForm && (
              <AddCorrespondenceForm
                applicationId={applicationId}
                userEmail={userEmail}
                onSubmit={handleCreate}
                onCancel={handleCancel}
              />
            )}

            {/* Correspondence List */}
            <CorrespondenceList
              correspondence={filteredCorrespondence}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/**
 * Skeleton loading state for CorrespondenceSection
 */
export function CorrespondenceSectionSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-6 w-36" />
      </div>
    </div>
  );
}
