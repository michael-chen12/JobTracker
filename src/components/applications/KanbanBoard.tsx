'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { arrayMove } from '@dnd-kit/sortable';
import { ApplicationRow } from './columns';
import { KanbanColumn } from './KanbanColumn';
import { ApplicationCard } from './ApplicationCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { updateApplication } from '@/actions/applications';
import { useToast } from '@/hooks/use-toast';
import { ApplicationStatus } from '@/types/application';
import { Skeleton } from '@/components/ui/skeleton';
import { CelebrationModal } from '@/components/achievements/CelebrationModal';
import type { CelebrationData } from '@/types/achievements';
import { useDashboardStore } from '@/stores/dashboard-store';

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
export function KanbanBoard() {
  const router = useRouter();
  const { toast } = useToast();
  const applications = useDashboardStore((state) => state.applications);
  const loading = useDashboardStore((state) => state.loading);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);

  // Memoize column building to avoid recalculating on every render
  const buildColumns = useMemo(() => {
    return (apps: ApplicationRow[]) =>
      COLUMNS.reduce(
        (acc, column) => {
          acc[column.id] = apps
            .filter((app) => app.status === column.id)
            .slice(0, 50); // Limit to 50 per column for performance
          return acc;
        },
        {} as Record<string, ApplicationRow[]>
      );
  }, []);

  const [columns, setColumns] = useState<Record<string, ApplicationRow[]>>(() =>
    buildColumns(applications)
  );

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag (prevents accidental drags on click)
      },
    })
  );

  // Only rebuild columns when applications data actually changes
  useEffect(() => {
    setColumns(buildColumns(applications));
  }, [applications, buildColumns]);

  const findColumnId = useCallback(
    (itemId: string, columnMap: Record<string, ApplicationRow[]>) => {
      if (columnMap[itemId]) return itemId;
      return (
        Object.keys(columnMap).find((columnId) =>
          columnMap[columnId]?.some((app) => app.id === itemId)
        ) ?? null
      );
    },
    []
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const applicationId = active.id as string;
    const overId = over.id as string;

    const sourceColumnId = findColumnId(applicationId, columns);
    const destinationColumnId = findColumnId(overId, columns);

    if (!sourceColumnId || !destinationColumnId) return;

    // Reorder within the same column
    if (sourceColumnId === destinationColumnId) {
      const columnItems = columns[sourceColumnId];
      if (!columnItems) return;
      const oldIndex = columnItems.findIndex((app) => app.id === applicationId);
      const newIndex = columnItems.findIndex((app) => app.id === overId);

      if (oldIndex === -1) return;
      const targetIndex = newIndex === -1 ? columnItems.length - 1 : newIndex;

      if (oldIndex !== targetIndex) {
        setColumns({
          ...columns,
          [sourceColumnId]: arrayMove(columnItems, oldIndex, targetIndex),
        });
      }

      return;
    }

    const sourceItems = columns[sourceColumnId];
    const destinationItems = columns[destinationColumnId];
    if (!sourceItems || !destinationItems) return;
    const activeIndex = sourceItems.findIndex((app) => app.id === applicationId);
    if (activeIndex === -1) return;

    const activeApplication = sourceItems[activeIndex];
    const newStatus = destinationColumnId as ApplicationStatus;

    const previousColumns = columns;
    const updatedSourceItems = sourceItems.filter((app) => app.id !== applicationId);
    const overIndex = destinationItems.findIndex((app) => app.id === overId);
    const insertIndex = overIndex === -1 ? destinationItems.length : overIndex;
    const updatedDestinationItems: ApplicationRow[] = [
      ...destinationItems.slice(0, insertIndex),
      { ...activeApplication, status: newStatus } as ApplicationRow,
      ...destinationItems.slice(insertIndex),
    ];

    setColumns({
      ...columns,
      [sourceColumnId]: updatedSourceItems,
      [destinationColumnId]: updatedDestinationItems,
    });

    // Update on server
    try {
      const result = await updateApplication(applicationId, {
        status: newStatus as ApplicationStatus,
      });

      if (result.error) {
        // Rollback on error
        setColumns(previousColumns);
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

        // Trigger celebration if achievements were unlocked
        if ('data' in result && result.celebrationData && result.celebrationData.length > 0) {
          const celebration = result.celebrationData[0];
          if (celebration) {
            setCelebrationData(celebration); // Show first celebration
          }
        }

        router.refresh();
      }
    } catch (error) {
      // Rollback on error
      setColumns(previousColumns);
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
  const activeApplication = useMemo(() => {
    if (!activeId) return null;
    for (const columnId of Object.keys(columns)) {
      const columnItems = columns[columnId];
      if (!columnItems) continue;
      const found = columnItems.find((app) => app.id === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, columns]);

  // Show loading skeleton while fetching
  if (loading) {
    return (
      <ScrollArea className="w-full">
        <div className="flex w-max gap-4 pb-4">
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
      </ScrollArea>
    );
  }

  return (
    <>
      {/* Celebration modal (rendered outside DndContext) */}
      <CelebrationModal
        celebrationData={celebrationData}
        onClose={() => setCelebrationData(null)}
      />

      {/* Kanban board with drag and drop */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
      {/* Kanban Columns — scroll-snap for mobile horizontal swiping */}
      <ScrollArea className="w-full">
        <div className="flex w-max gap-4 pb-4 snap-x snap-mandatory md:snap-none">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              applications={columns[column.id] || []}
              color={column.color}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Drag Overlay - shows the card being dragged */}
      <DragOverlay>
        {activeApplication ? (
          <ApplicationCard application={activeApplication} />
        ) : null}
      </DragOverlay>
    </DndContext>
    </>
  );
}
