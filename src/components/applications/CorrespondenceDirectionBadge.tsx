/**
 * CorrespondenceDirectionBadge Component
 * Ticket #25: Email Correspondence
 *
 * Badge displaying correspondence direction (Received/Sent) with icon
 */

import { Badge } from '@/components/ui/badge';
import { getDirectionConfig } from '@/lib/utils/correspondenceHelpers';
import type { CorrespondenceDirection } from '@/types/application';

interface CorrespondenceDirectionBadgeProps {
  direction: CorrespondenceDirection;
  size?: 'sm' | 'default';
}

export function CorrespondenceDirectionBadge({
  direction,
  size = 'default',
}: CorrespondenceDirectionBadgeProps) {
  const { bg, text, icon, label } = getDirectionConfig(direction);

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
