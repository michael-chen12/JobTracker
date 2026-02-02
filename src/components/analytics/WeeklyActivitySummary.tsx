'use client';

import { format } from 'date-fns';
import { Activity, FileText, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { WeeklyActivity, BaselinePacing } from '@/types/insights';

interface WeeklyActivitySummaryProps {
  weeklyActivity: WeeklyActivity;
  baseline: BaselinePacing;
}

export function WeeklyActivitySummary({ weeklyActivity, baseline }: WeeklyActivitySummaryProps) {
  // Format week range (e.g., "Jan 27 - Feb 2")
  const weekRange = `${format(weeklyActivity.weekStart, 'MMM d')} - ${format(weeklyActivity.weekEnd, 'MMM d')}`;

  // Generate baseline comparison text
  const getBaselineComparisonText = (): string => {
    if (baseline.averageWeeklyApplications === 0) {
      return "Building your baseline...";
    }

    const { currentWeekApplications, averageWeeklyApplications, percentageOfBaseline } = baseline;

    if (percentageOfBaseline > 120) {
      return `You're crushing it! ${currentWeekApplications} apps vs ${averageWeeklyApplications.toFixed(1)} avg (${percentageOfBaseline}% of baseline)`;
    } else if (percentageOfBaseline >= 80) {
      return `On track with ${currentWeekApplications} apps vs ${averageWeeklyApplications.toFixed(1)} avg (${percentageOfBaseline}% of baseline)`;
    } else {
      return `Below baseline: ${currentWeekApplications} apps vs ${averageWeeklyApplications.toFixed(1)} avg (${percentageOfBaseline}% of baseline)`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Weekly Activity</CardTitle>
        </div>
        <CardDescription>{weekRange}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 3-column grid: Applications, Notes, Updates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Applications */}
            <div className="flex flex-col items-center justify-center rounded-lg border bg-background p-4">
              <div className="text-3xl font-bold text-blue-600">
                {weeklyActivity.applications}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>Applications</span>
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col items-center justify-center rounded-lg border bg-background p-4">
              <div className="text-3xl font-bold text-purple-600">
                {weeklyActivity.notes}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Notes</span>
              </div>
            </div>

            {/* Updates */}
            <div className="flex flex-col items-center justify-center rounded-lg border bg-background p-4">
              <div className="text-3xl font-bold text-orange-600">
                {weeklyActivity.statusChanges}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4" />
                <span>Updates</span>
              </div>
            </div>
          </div>

          {/* Baseline comparison text */}
          <div className="text-center text-sm text-muted-foreground">
            {getBaselineComparisonText()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
