'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ApplicationRow } from './columns';
import { ApplicationCard } from './ApplicationCard';

interface SortableApplicationCardProps {
  application: ApplicationRow;
}

/**
 * SortableApplicationCard - Draggable wrapper for ApplicationCard
 */
export function SortableApplicationCard({ application }: SortableApplicationCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: application.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ApplicationCard application={application} />
    </div>
  );
}
