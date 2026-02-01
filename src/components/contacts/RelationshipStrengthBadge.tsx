/**
 * RelationshipStrengthBadge Component
 * Ticket #17: Interaction History Tracking
 *
 * Badge displaying relationship strength with optional tooltip
 */

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getRelationshipStrengthColors } from '@/lib/utils/interactionHelpers';
import type { RelationshipStrengthResult } from '@/types/contacts';

interface RelationshipStrengthBadgeProps {
  strengthData: RelationshipStrengthResult;
  showTooltip?: boolean;
}

export function RelationshipStrengthBadge({
  strengthData,
  showTooltip = true,
}: RelationshipStrengthBadgeProps) {
  const { strength, recentInteractionCount } = strengthData;
  const { bg, text, icon, label } = getRelationshipStrengthColors(strength);

  const badge = (
    <Badge className={`${bg} ${text} gap-1`}>
      <span>{icon}</span>
      <span>{label}</span>
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>
            {recentInteractionCount}{' '}
            {recentInteractionCount === 1 ? 'interaction' : 'interactions'} in
            last 30 days
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
