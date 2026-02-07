'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { InsightItem } from '@/types/insights';
import * as Icons from 'lucide-react';

interface InsightCardProps {
  insight: InsightItem;
}

interface InsightCardFrameProps extends InsightCardProps {
  children?: React.ReactNode;
}

/**
 * InsightCard - Displays a wellness/activity insight in a card format
 *
 * Shows:
 * - Insight icon (Lucide React icon)
 * - Insight title
 * - Insight message
 * - Severity-based left border (info=blue, warning=amber, critical=red)
 *
 * Note: Unlike WinCard, InsightCard does NOT display timestamp
 */
function InsightCardFrame({ insight, children }: InsightCardFrameProps) {
  // Map severity to border color
  const severityBorderClass = {
    info: 'border-blue-200',
    warning: 'border-amber-200',
    critical: 'border-red-200',
  }[insight.severity];

  return (
    <Card className={`hover:shadow-md transition-shadow border-l-4 ${severityBorderClass}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon slot */}
          {children && (
            <div className="flex-shrink-0" data-testid="insight-icon">
              {children}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="font-semibold text-base mb-1 truncate">
              {insight.title}
            </h3>

            {/* Message */}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {insight.message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getInsightIcon(insight: InsightItem): React.ReactNode {
  const IconComponent = Icons[
    insight.icon as keyof typeof Icons
  ] as React.ComponentType<{ className?: string }>;

  if (!IconComponent) {
    return null;
  }

  return <IconComponent className={`h-6 w-6 ${insight.iconColor}`} />;
}

export function InsightCard({ insight }: InsightCardProps) {
  const icon = getInsightIcon(insight);

  return (
    <InsightCardFrame insight={insight}>{icon}</InsightCardFrame>
  );
}

export function CompactInsightCard({ insight }: InsightCardProps) {
  return <InsightCardFrame insight={insight} />;
}
