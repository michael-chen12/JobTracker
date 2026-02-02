'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { WinCard } from '@/components/achievements/WinCard';
import { InsightCard } from '@/components/insights/InsightCard';
import { getAchievements } from '@/actions/achievements';
import type { AchievementWithMetadata } from '@/types/achievements';
import type { InsightItem } from '@/types/insights';

/**
 * JourneyItem - Unified type for timeline display
 */
type JourneyItem =
  | { type: 'achievement'; data: AchievementWithMetadata; timestamp: Date }
  | { type: 'insight'; data: InsightItem; timestamp: Date };

/**
 * YourJourneySection - Dashboard widget showing recent achievements and insights
 *
 * Features:
 * - Displays combined timeline of achievements and insights
 * - Fetches top 10 achievements and insights in parallel
 * - Sorts by timestamp (newest first) and displays top 5
 * - Loading skeleton while fetching
 * - Empty state with encouraging message
 * - "View All" link to full journey page
 * - Collapsible with Sparkles icon
 */
export function YourJourneySection() {
  const [journeyItems, setJourneyItems] = useState<JourneyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchJourneyData() {
      try {
        // Fetch achievements and insights in parallel
        const [achievementsResult] = await Promise.all([
          getAchievements(10), // Top 10 achievements
          // TODO: Add getInsights(10) when Task 8 is complete
        ]);

        // Process achievements
        const achievements: AchievementWithMetadata[] = [];
        if ('data' in achievementsResult && achievementsResult.data) {
          achievements.push(...achievementsResult.data);
        } else if ('error' in achievementsResult && achievementsResult.error) {
          setError(achievementsResult.error);
          setLoading(false);
          return;
        }

        // Process insights (placeholder for Task 8)
        const insights: InsightItem[] = [];
        // TODO: Process insights result when Task 8 is complete

        // Combine achievements and insights into unified timeline
        const combined: JourneyItem[] = [
          ...achievements.map((achievement) => ({
            type: 'achievement' as const,
            data: achievement,
            timestamp: new Date(achievement.achieved_at),
          })),
          ...insights.map((insight) => ({
            type: 'insight' as const,
            data: insight,
            timestamp: insight.createdAt,
          })),
        ];

        // Sort by timestamp (newest first) and take top 5
        const sortedItems = combined
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 5);

        setJourneyItems(sortedItems);
      } catch (err) {
        setError('Failed to load your journey');
        console.error('Error fetching journey data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchJourneyData();
  }, []);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-70 transition-opacity flex-1 cursor-pointer">
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
              <Sparkles className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">Your Journey</CardTitle>
            </CollapsibleTrigger>
            {!loading && journeyItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <Link href="/dashboard/wins" className="flex items-center gap-1">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent>
            {/* Loading state */}
            {loading && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <p className="text-sm text-muted-foreground text-center py-8">
                {error}
              </p>
            )}

            {/* Empty state */}
            {!loading && !error && journeyItems.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Your journey starts here. Create your first application!
                </p>
              </div>
            )}

            {/* Journey items list */}
            {!loading && !error && journeyItems.length > 0 && (
              <div className="space-y-3">
                {journeyItems.map((item, index) => {
                  if (item.type === 'achievement') {
                    return (
                      <WinCard
                        key={`achievement-${item.data.id}`}
                        achievement={item.data}
                        showIcon={false}
                      />
                    );
                  } else {
                    return (
                      <InsightCard
                        key={`insight-${item.data.id}`}
                        insight={item.data}
                        showIcon={false}
                      />
                    );
                  }
                })}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
