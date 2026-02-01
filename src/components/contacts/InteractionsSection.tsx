/**
 * InteractionsSection Component
 * Ticket #17: Interaction History Tracking
 *
 * Main orchestrator for interactions functionality
 * Handles collapsible section, add form, filters, and optimistic updates
 * Based on NotesSection pattern from src/components/notes/NotesSection.tsx
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import {
  createContactInteraction,
  deleteContactInteraction,
} from '@/actions/contacts';
import { InteractionsList } from './InteractionsList';
import { AddInteractionForm } from './AddInteractionForm';
import { InteractionFilters } from './InteractionFilters';
import type {
  ContactInteraction,
  InteractionFilters as IFilters,
  InteractionType,
} from '@/types/contacts';
import type { ContactInteractionData } from '@/schemas/contact';

interface InteractionsSectionProps {
  contactId: string;
  initialInteractions: ContactInteraction[];
}

/**
 * Apply filters to interaction list
 */
function applyFilters(
  interactions: ContactInteraction[],
  filters: IFilters
): ContactInteraction[] {
  let filtered = [...interactions];

  // Filter by types
  if (filters.types && filters.types.length > 0) {
    filtered = filtered.filter((interaction) =>
      filters.types!.includes(interaction.interaction_type as InteractionType)
    );
  }

  // Filter by date range
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    filtered = filtered.filter(
      (interaction) => new Date(interaction.interaction_date) >= fromDate
    );
  }

  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    filtered = filtered.filter(
      (interaction) => new Date(interaction.interaction_date) <= toDate
    );
  }

  return filtered;
}

/**
 * InteractionsSection - Main orchestrator for interactions functionality
 */
export function InteractionsSection({
  contactId,
  initialInteractions,
}: InteractionsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [interactions, setInteractions] =
    useState<ContactInteraction[]>(initialInteractions);
  const [deletingInteractionId, setDeletingInteractionId] = useState<
    string | null
  >(null);
  const [filters, setFilters] = useState<IFilters>({
    types: [],
    dateFrom: undefined,
    dateTo: undefined,
  });
  const { toast } = useToast();
  const router = useRouter();

  // Apply filters to interactions
  const filteredInteractions = useMemo(
    () => applyFilters(interactions, filters),
    [interactions, filters]
  );

  // Optimistic create
  const handleInteractionCreated = async (data: ContactInteractionData) => {
    // Create temporary interaction for optimistic update
    const tempInteraction: ContactInteraction = {
      id: crypto.randomUUID(),
      contact_id: data.contactId,
      interaction_type: data.interactionType,
      interaction_date: data.interactionDate || new Date().toISOString(),
      notes: data.notes || null,
      created_at: new Date().toISOString(),
    };

    // Optimistic update: add to list
    setInteractions((prev) => [tempInteraction, ...prev]);
    setShowAddForm(false);

    // Server action
    const result = await createContactInteraction({
      contactId: data.contactId,
      interactionType: data.interactionType,
      interactionDate: data.interactionDate,
      notes: data.notes,
    });

    if (result.error || !result.interaction) {
      // Rollback on error
      setInteractions((prev) =>
        prev.filter((i) => i.id !== tempInteraction.id)
      );
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to create interaction',
      });
      setShowAddForm(true);
    } else {
      // Replace temp interaction with real one
      setInteractions((prev) =>
        prev.map((i) => (i.id === tempInteraction.id ? result.interaction! : i))
      );
      toast({
        title: 'Success',
        description: 'Interaction logged successfully',
      });
      router.refresh();
    }
  };

  // Optimistic delete
  const handleInteractionDeleted = async (interactionId: string) => {
    setDeletingInteractionId(interactionId);

    // Store for rollback
    const deletedInteraction = interactions.find((i) => i.id === interactionId);

    // Optimistic update: remove from list
    setInteractions((prev) => prev.filter((i) => i.id !== interactionId));

    // Server action
    const result = await deleteContactInteraction(interactionId, contactId);

    setDeletingInteractionId(null);

    if (result.error) {
      // Rollback on error
      if (deletedInteraction) {
        setInteractions((prev) =>
          [...prev, deletedInteraction].sort(
            (a, b) =>
              new Date(b.interaction_date).getTime() -
              new Date(a.interaction_date).getTime()
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
        description: 'Interaction deleted successfully',
      });
      router.refresh();
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-6">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          <ChevronRight
            className={`h-5 w-5 transition-transform ${
              isOpen ? 'rotate-90' : ''
            }`}
          />
          <span>Interactions</span>
          {interactions.length > 0 && (
            <Badge variant="secondary" className="text-sm">
              {filteredInteractions.length}
              {filteredInteractions.length !== interactions.length &&
                ` / ${interactions.length}`}
            </Badge>
          )}
        </CollapsibleTrigger>

        {isOpen && !showAddForm && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Log Interaction
          </Button>
        )}
      </div>

      <CollapsibleContent className="mt-4 space-y-4">
        {/* Filters */}
        <InteractionFilters filters={filters} onFiltersChange={setFilters} />

        {/* Add Form */}
        {showAddForm && (
          <AddInteractionForm
            contactId={contactId}
            onSubmit={handleInteractionCreated}
            onCancel={handleCancel}
          />
        )}

        {/* Interactions List */}
        <InteractionsList
          interactions={filteredInteractions}
          onDelete={handleInteractionDeleted}
          deletingInteractionId={deletingInteractionId}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
