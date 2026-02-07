'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CompactWinCard } from '@/components/achievements/WinCard';
import { CompactInsightCard } from '@/components/insights/InsightCard';
import type { AchievementWithMetadata } from '@/types/achievements';
import type { InsightItem } from '@/types/insights';

/**
 * JourneyItem - Unified type for timeline display
 */
type JourneyItem =
  | { type: 'achievement'; data: AchievementWithMetadata; timestamp: Date }
  | { type: 'insight'; data: InsightItem; timestamp: Date };

interface YourJourneySectionProps {
  initialAchievements?: AchievementWithMetadata[];
  error?: string | null;
}

const EMPTY_ACHIEVEMENTS: AchievementWithMetadata[] = [];
const EMPTY_INSIGHTS: InsightItem[] = [];

/**
 * YourJourneySection - Dashboard widget showing recent achievements and insights
 *
 * Features:
 * - Displays combined timeline of achievements and insights
 * - Receives prefetched achievements from the server
 * - Sorts by timestamp (newest first) and displays top 5
 * - Empty state with encouraging message
 * - "View All" link to full journey page
 * - Collapsible with Sparkles icon
 */
export function YourJourneySection({
  initialAchievements = EMPTY_ACHIEVEMENTS,
  error = null,
}: YourJourneySectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const journeyItems = useMemo<JourneyItem[]>(() => {
    const combined: JourneyItem[] = [
      ...initialAchievements.map((achievement) => ({
        type: 'achievement' as const,
        data: achievement,
        timestamp: new Date(achievement.achieved_at),
      })),
      // TODO: Merge prefetched insights once insights are added to dashboard payload.
      ...EMPTY_INSIGHTS.map((insight) => ({
        type: 'insight' as const,
        data: insight,
        timestamp: insight.createdAt,
      })),
    ];

    return combined
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  }, [initialAchievements]);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CollapsibleTrigger className="flex min-w-0 items-center gap-2 hover:opacity-70 transition-opacity flex-1 cursor-pointer">
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
              <Sparkles className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-base sm:text-lg">Your Journey</CardTitle>
            </CollapsibleTrigger>
            {journeyItems.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                asChild
                onClick={(e) => e.stopPropagation()}
                className="self-start sm:self-auto"
              >
                <Link href="/dashboard/wins" className="flex items-center gap-1">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            {/* Error state */}
            {error ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {error}
              </p>
            ) : null}

            {/* Empty state */}
            {!error && journeyItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Your journey starts here. Create your first application!
                </p>
              </div>
            ) : null}

            {/* Journey items list */}
            {!error && journeyItems.length > 0 ? (
              <div className="space-y-3">
                {journeyItems.map((item) => {
                  if (item.type === 'achievement') {
                    return (
                      <CompactWinCard
                        key={`achievement-${item.data.id}`}
                        achievement={item.data}
                      />
                    );
                  } else {
                    return (
                      <CompactInsightCard
                        key={`insight-${item.data.id}`}
                        insight={item.data}
                      />
                    );
                  }
                })}
              </div>
            ) : null}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
