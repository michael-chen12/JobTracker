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
}

export function RelationshipStrengthPill({
  strengthData,
}: RelationshipStrengthBadgeProps) {
  const { strength, recentInteractionCount } = strengthData;
  const { bg, text, icon, label } = getRelationshipStrengthColors(strength);
  const interactionLabel =
    recentInteractionCount === 1 ? 'interaction' : 'interactions';

  return (
    <Badge
      className={`${bg} ${text} gap-1`}
      aria-label={`${label}. ${recentInteractionCount} ${interactionLabel} in last 30 days.`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Badge>
  );
}

export function RelationshipStrengthBadge({
  strengthData,
}: RelationshipStrengthBadgeProps) {
  const { recentInteractionCount } = strengthData;
  const interactionLabel =
    recentInteractionCount === 1 ? 'interaction' : 'interactions';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <RelationshipStrengthPill strengthData={strengthData} />
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {recentInteractionCount} {interactionLabel} in last 30 days
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
