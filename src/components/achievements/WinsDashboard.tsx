'use client';

import React from 'react';
import { Trophy } from 'lucide-react';
import { WinCard } from './WinCard';
import type { AchievementWithMetadata } from '@/types/achievements';

interface WinsDashboardProps {
  achievements: AchievementWithMetadata[];
}

/**
 * WinsDashboard - Full page view of all achievements
 *
 * Features:
 * - Responsive grid layout (1 col mobile → 2 cols tablet → 3 cols desktop)
 * - Shows all achievements in chronological order
 * - Empty state with encouraging message
 */
export function WinsDashboard({ achievements }: WinsDashboardProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy className="h-7 w-7 sm:h-8 sm:w-8 text-yellow-500" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Your Achievements</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Celebrate your job search milestones and progress
          </p>
        </div>
      </div>

      {/* Empty state */}
      {achievements.length === 0 && (
        <div className="text-center py-16">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            No achievements yet
          </h2>
          <p className="text-muted-foreground">
            Start applying to unlock wins! Your first application will earn you
            your first achievement.
          </p>
        </div>
      )}

      {/* Achievements grid */}
      {achievements.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <WinCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      )}
    </div>
  );
}
