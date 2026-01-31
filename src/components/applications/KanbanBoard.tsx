'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { ApplicationRow } from './columns';
import { KanbanColumn } from './KanbanColumn';
import { ApplicationCard } from './ApplicationCard';
import { updateApplication } from '@/actions/applications';
import { useToast } from '@/hooks/use-toast';
import { ApplicationStatus } from '@/types/application';
import { Skeleton } from '@/components/ui/skeleton';

interface KanbanBoardProps {
  applications: ApplicationRow[];
  loading?: boolean;
}

// Column definitions matching the database enum
const COLUMNS = [
  { id: 'bookmarked', title: 'Bookmarked', color: '#9CA3AF' },
  { id: 'applied', title: 'Applied', color: '#3B82F6' },
  { id: 'screening', title: 'Screening', color: '#F59E0B' },
  { id: 'interviewing', title: 'Interviewing', color: '#10B981' },
  { id: 'offer', title: 'Offer', color: '#8B5CF6' },
  { id: 'rejected', title: 'Rejected', color: '#EF4444' },
  { id: 'accepted', title: 'Accepted', color: '#059669' },
  { id: 'withdrawn', title: 'Withdrawn', color: '#6B7280' },
];

/**
 * KanbanBoard - Drag-and-drop kanban board for applications
 *
 * Features:
 * - Drag cards between columns to update status
 * - Optimistic UI updates with rollback on error
 * - Limited to 50 cards per column for performance
 * - Touch-friendly for mobile devices
 * - Loading skeletons while fetching data
 */
export function KanbanBoard({ applications, loading = false }: KanbanBoardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag (prevents accidental drags on click)
      },
    })
  );

  // Group applications by status
  const applicationsByStatus = COLUMNS.reduce(
    (acc, column) => {
      acc[column.id] = applications
        .filter((app) => app.status === column.id)
        .slice(0, 50); // Limit to 50 per column for performance
      return acc;
    },
    {} as Record<string, ApplicationRow[]>
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const applicationId = active.id as string;
    let newStatus = over.id as string;

    // If dropped over a card (not a column), find the column that card belongs to
    const droppedOverApplication = applications.find((app) => app.id === newStatus);
    if (droppedOverApplication) {
      newStatus = droppedOverApplication.status;
    }

    // Validate that newStatus is a valid column
    if (!COLUMNS.find((col) => col.id === newStatus)) {
      return;
    }

    // Find the application being dragged
    const application = applications.find((app) => app.id === applicationId);
    if (!application) return;

    // No change if dropped in same column
    if (application.status === newStatus) return;

    // Optimistic update - update UI immediately
    const originalStatus = application.status;
    application.status = newStatus as ApplicationStatus;

    // Update on server
    try {
      const result = await updateApplication(applicationId, {
        status: newStatus as ApplicationStatus,
      });

      if (result.error) {
        // Rollback on error
        application.status = originalStatus;
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else {
        // Show success and refresh
        toast({
          title: 'Status Updated',
          description: `Moved to ${COLUMNS.find((c) => c.id === newStatus)?.title}`,
        });
        router.refresh();
      }
    } catch (error) {
      // Rollback on error
      application.status = originalStatus;
      console.error('Failed to update status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update application status',
      });
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Find the active application for drag overlay
  const activeApplication = activeId
    ? applications.find((app) => app.id === activeId)
    : null;

  // Show loading skeleton while fetching
  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-80 bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
          >
            {/* Column header skeleton */}
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
            {/* Card skeletons */}
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3"
                >
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            applications={applicationsByStatus[column.id] || []}
            color={column.color}
          />
        ))}
      </div>

      {/* Drag Overlay - shows the card being dragged */}
      <DragOverlay>
        {activeApplication ? (
          <ApplicationCard application={activeApplication} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
