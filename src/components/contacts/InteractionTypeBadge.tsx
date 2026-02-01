/**
 * InteractionTypeBadge Component
 * Ticket #17: Interaction History Tracking
 *
 * Simple badge displaying interaction type with icon
 */

import { Badge } from '@/components/ui/badge';
import { getInteractionTypeColors } from '@/lib/utils/interactionHelpers';
import type { InteractionType } from '@/types/contacts';

interface InteractionTypeBadgeProps {
  type: InteractionType;
  size?: 'sm' | 'default';
}

export function InteractionTypeBadge({
  type,
  size = 'default',
}: InteractionTypeBadgeProps) {
  const { bg, text, icon, label } = getInteractionTypeColors(type);

  return (
    <Badge
      variant="outline"
      className={`${bg} ${text} gap-1 ${size === 'sm' ? 'text-xs px-2 py-0.5' : ''}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Badge>
  );
}
