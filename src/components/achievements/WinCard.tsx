'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getAchievementConfig } from '@/lib/achievements/config';
import type { AchievementWithMetadata } from '@/types/achievements';
import { formatDistanceToNow } from 'date-fns';
import * as Icons from 'lucide-react';

interface WinCardProps {
  achievement: AchievementWithMetadata;
}

interface WinCardFrameProps extends WinCardProps {
  children?: React.ReactNode;
}

/**
 * WinCard - Displays a single achievement in a card format
 *
 * Shows:
 * - Achievement icon (Lucide React icon)
 * - Achievement title
 * - Personalized message
 * - Relative time (e.g., "2 days ago")
 */
function WinCardFrame({ achievement, children }: WinCardFrameProps) {
  const config = getAchievementConfig(achievement.achievement_type);
  const message = config.getMessage(achievement.metadata);

  // Format relative time
  const relativeTime = formatDistanceToNow(new Date(achievement.achieved_at), {
    addSuffix: true,
  });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon slot */}
          {children && (
            <div className="flex-shrink-0">
              {children}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="font-semibold text-base mb-1 truncate">
              {config.title}
            </h3>

            {/* Message */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {message}
            </p>

            {/* Time */}
            <p className="text-xs text-muted-foreground">{relativeTime}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getWinIcon(achievement: AchievementWithMetadata): React.ReactNode {
  const config = getAchievementConfig(achievement.achievement_type);
  const IconComponent = Icons[
    config.icon as keyof typeof Icons
  ] as React.ComponentType<{ className?: string }>;

  if (!IconComponent) {
    return null;
  }

  return <IconComponent className={`h-6 w-6 ${config.iconColor}`} />;
}

export function WinCard({ achievement }: WinCardProps) {
  const icon = getWinIcon(achievement);

  return (
    <WinCardFrame achievement={achievement}>{icon}</WinCardFrame>
  );
}

export function CompactWinCard({ achievement }: WinCardProps) {
  return <WinCardFrame achievement={achievement} />;
}
