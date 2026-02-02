'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getAchievementConfig } from '@/lib/achievements/config';
import type { AchievementWithMetadata } from '@/types/achievements';
import { formatDistanceToNow } from 'date-fns';
import * as Icons from 'lucide-react';

interface WinCardProps {
  achievement: AchievementWithMetadata;
  showIcon?: boolean; // Optional prop to show/hide icon
}

/**
 * WinCard - Displays a single achievement in a card format
 *
 * Shows:
 * - Achievement icon (Lucide React icon) - optional
 * - Achievement title
 * - Personalized message
 * - Relative time (e.g., "2 days ago")
 */
export function WinCard({ achievement, showIcon = true }: WinCardProps) {
  const config = getAchievementConfig(achievement.achievement_type);
  const message = config.getMessage(achievement.metadata);

  // Get Lucide icon component dynamically
  const IconComponent = Icons[config.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;

  // Format relative time
  const relativeTime = formatDistanceToNow(new Date(achievement.achieved_at), {
    addSuffix: true,
  });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon - conditionally rendered */}
          {showIcon && IconComponent && (
            <div className="flex-shrink-0">
              <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
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
