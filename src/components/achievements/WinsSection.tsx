'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { WinCard } from './WinCard';
import { getAchievements } from '@/actions/achievements';
import type { AchievementWithMetadata } from '@/types/achievements';

/**
 * WinsSection - Dashboard widget showing recent achievements
 *
 * Features:
 * - Displays most recent 5 achievements
 * - Loading skeleton while fetching
 * - Empty state with encouraging message
 * - "View All" link to full wins page
 */
export function WinsSection() {
  const [achievements, setAchievements] = useState<AchievementWithMetadata[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchAchievements() {
      try {
        const result = await getAchievements(5); // Fetch recent 5 achievements

        if ('error' in result && result.error) {
          setError(result.error);
        } else if ('data' in result && result.data) {
          setAchievements(result.data);
        }
      } catch (err) {
        setError('Failed to load achievements');
        console.error('Error fetching achievements:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAchievements();
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
              <CardTitle className="text-lg">Recent Wins</CardTitle>
            </CollapsibleTrigger>
            {!loading && achievements.length > 0 && (
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
                    <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
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
        {!loading && !error && achievements.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Your achievements will appear here. Keep applying!
            </p>
          </div>
        )}

        {/* Achievements list */}
        {!loading && !error && achievements.length > 0 && (
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <WinCard key={achievement.id} achievement={achievement} showIcon={false} />
            ))}
          </div>
        )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
