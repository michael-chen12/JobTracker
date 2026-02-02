'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ApplicationRow } from './columns';
import { SortableApplicationCard } from './SortableApplicationCard';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KanbanColumnProps {
  id: string;
  title: string;
  applications: ApplicationRow[];
  color: string;
}

/**
 * KanbanColumn - Droppable column for kanban board
 */
export function KanbanColumn({ id, title, applications, color }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex flex-col min-w-[300px] max-w-[300px] bg-gray-50 dark:bg-gray-900/50 rounded-lg">
      {/* Column Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            {title}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {applications.length}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <ScrollArea
        ref={setNodeRef}
        className="flex-1 max-h-[calc(100vh-400px)]"
      >
        <div className="p-4 space-y-3">
          <SortableContext
            items={applications.map((app) => app.id)}
            strategy={verticalListSortingStrategy}
          >
            {applications.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-600 text-sm">
                No applications
              </div>
            ) : (
              applications.map((application) => (
                <SortableApplicationCard
                  key={application.id}
                  application={application}
                />
              ))
            )}
          </SortableContext>
        </div>
      </ScrollArea>
    </div>
  );
}
