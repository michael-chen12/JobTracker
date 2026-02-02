// Activity insights calculator
// This file contains pure business logic for calculating burnout, weekly activity, and baseline pacing

import {
  subDays,
  subWeeks,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  differenceInWeeks,
} from 'date-fns';
import type { Application, ApplicationNote } from '@/types/application';
import type {
  BurnoutDetection,
  WeeklyActivity,
  BaselinePacing,
  InsightItem,
  InsightsResult,
} from '@/types/insights';

/**
 * Detect burnout based on rejection rate in the last 30 days
 *
 * Burnout detection criteria:
 * - At least 10 applications in the last 30 days
 * - Rejection rate > 80%
 * - Excludes withdrawn applications
 */
export function detectBurnout(applications: Application[]): BurnoutDetection {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  // Filter applications from last 30 days (excluding withdrawn)
  const recentApps = applications.filter((app) => {
    const createdAt = new Date(app.created_at);
    const isRecent = createdAt >= thirtyDaysAgo;
    const notWithdrawn = app.status !== 'withdrawn';
    return isRecent && notWithdrawn;
  });

  const recentApplicationsCount = recentApps.length;
  const rejectionsCount = recentApps.filter((app) => app.status === 'rejected').length;
  const rejectionRate = recentApplicationsCount > 0 ? rejectionsCount / recentApplicationsCount : 0;

  // Burnout is detected if there are at least 10 applications and rejection rate > 80%
  const hasHighRejectionRate = recentApplicationsCount >= 10 && rejectionRate > 0.8;

  return {
    hasHighRejectionRate,
    rejectionRate,
    recentApplicationsCount,
    rejectionsCount,
  };
}

/**
 * Calculate weekly activity metrics for the current week
 *
 * Counts:
 * - Applications created this week
 * - Notes created this week
 * - Status changes this week (detected by looking at application update timestamps)
 */
export function calculateWeeklyActivity(
  applications: Application[],
  notes: ApplicationNote[]
): WeeklyActivity {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

  // Count applications created this week
  const appsThisWeek = applications.filter((app) => {
    const createdAt = new Date(app.created_at);
    return isWithinInterval(createdAt, { start: weekStart, end: weekEnd });
  });

  // Count notes created this week
  const notesThisWeek = notes.filter((note) => {
    const createdAt = new Date(note.created_at);
    return isWithinInterval(createdAt, { start: weekStart, end: weekEnd });
  });

  // Count status changes this week
  // We detect status changes by checking if updated_at is this week and different from created_at
  const statusChanges = applications.filter((app) => {
    if (!app.updated_at) return false;
    const updatedAt = new Date(app.updated_at);
    const createdAt = new Date(app.created_at);
    const updatedThisWeek = isWithinInterval(updatedAt, { start: weekStart, end: weekEnd });
    const isStatusChange = updatedAt.getTime() !== createdAt.getTime();
    return updatedThisWeek && isStatusChange;
  }).length;

  return {
    applications: appsThisWeek.length,
    notes: notesThisWeek.length,
    statusChanges,
    weekStart,
    weekEnd,
  };
}

/**
 * Calculate baseline pacing over the last 8 weeks
 *
 * Returns:
 * - Average weekly applications
 * - Number of weeks analyzed
 * - Current week applications
 * - Percentage of baseline (current week vs average)
 */
export function calculateBaseline(applications: Application[]): BaselinePacing {
  const now = new Date();
  const eightWeeksAgo = subWeeks(now, 8);
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

  // Get applications from last 8 weeks
  const recentApps = applications.filter((app) => {
    const createdAt = new Date(app.created_at);
    return createdAt >= eightWeeksAgo;
  });

  // Calculate number of weeks we have data for
  let weeksAnalyzed = 8;
  if (recentApps.length > 0) {
    const oldestAppDate = new Date(
      Math.min(...recentApps.map((app) => new Date(app.created_at).getTime()))
    );
    const actualWeeks = differenceInWeeks(now, oldestAppDate);
    weeksAnalyzed = Math.min(actualWeeks + 1, 8); // +1 to include current week
  }

  // Calculate average weekly applications
  const averageWeeklyApplications =
    weeksAnalyzed > 0 ? recentApps.length / weeksAnalyzed : 0;

  // Count applications in current week
  const currentWeekApplications = applications.filter((app) => {
    const createdAt = new Date(app.created_at);
    return isWithinInterval(createdAt, { start: weekStart, end: weekEnd });
  }).length;

  // Calculate percentage of baseline
  const percentageOfBaseline =
    averageWeeklyApplications > 0
      ? Math.round((currentWeekApplications / averageWeeklyApplications) * 100)
      : 0;

  return {
    averageWeeklyApplications: Math.round(averageWeeklyApplications * 10) / 10, // Round to 1 decimal
    weeksAnalyzed,
    currentWeekApplications,
    percentageOfBaseline,
  };
}

/**
 * Generate insight items based on burnout, weekly activity, and baseline
 */
export function generateInsights(
  burnout: BurnoutDetection,
  weeklyActivity: WeeklyActivity,
  baseline: BaselinePacing
): InsightItem[] {
  const insights: InsightItem[] = [];

  // Insight 1: Burnout Warning
  if (burnout.hasHighRejectionRate) {
    insights.push({
      id: `insight-burnout-${Date.now()}`,
      type: 'burnout_warning',
      severity: 'warning',
      title: 'High Rejection Rate Detected',
      message: `You've received ${burnout.rejectionsCount} rejections out of ${burnout.recentApplicationsCount} applications (${Math.round(burnout.rejectionRate * 100)}%) in the last 30 days. Consider refining your approach or taking a short break.`,
      icon: 'AlertTriangle',
      iconColor: 'text-orange-500',
      createdAt: new Date(),
      metadata: {
        rejectionRate: burnout.rejectionRate,
        recentApplicationsCount: burnout.recentApplicationsCount,
        rejectionsCount: burnout.rejectionsCount,
      },
    });
  }

  // Insight 2: Weekly Summary
  insights.push({
    id: `insight-weekly-${Date.now()}`,
    type: 'weekly_summary',
    severity: 'info',
    title: 'This Week\'s Activity',
    message: `You've submitted ${weeklyActivity.applications} applications, added ${weeklyActivity.notes} notes, and had ${weeklyActivity.statusChanges} status updates this week. ${weeklyActivity.applications > baseline.averageWeeklyApplications ? 'Great momentum!' : 'Keep pushing!'}`,
    icon: 'TrendingUp',
    iconColor: 'text-blue-500',
    createdAt: new Date(),
    metadata: {
      applications: weeklyActivity.applications,
      notes: weeklyActivity.notes,
      statusChanges: weeklyActivity.statusChanges,
    },
  });

  // Insight 3: Pacing Suggestion
  if (baseline.averageWeeklyApplications > 0) {
    const isAboveBaseline = baseline.percentageOfBaseline > 120;
    const isBelowBaseline = baseline.percentageOfBaseline < 80;

    if (isAboveBaseline) {
      insights.push({
        id: `insight-pacing-above-${Date.now()}`,
        type: 'pacing_suggestion',
        severity: 'info',
        title: 'Above Your Baseline',
        message: `You're applying at ${baseline.percentageOfBaseline}% of your average pace (${baseline.currentWeekApplications} applications vs. ${baseline.averageWeeklyApplications} avg). You're above your baseline - excellent progress!`,
        icon: 'Zap',
        iconColor: 'text-green-500',
        createdAt: new Date(),
        metadata: {
          percentageOfBaseline: baseline.percentageOfBaseline,
          currentWeekApplications: baseline.currentWeekApplications,
          averageWeeklyApplications: baseline.averageWeeklyApplications,
        },
      });
    } else if (isBelowBaseline) {
      insights.push({
        id: `insight-pacing-below-${Date.now()}`,
        type: 'pacing_suggestion',
        severity: 'info',
        title: 'Below Your Baseline',
        message: `You're applying at ${baseline.percentageOfBaseline}% of your average pace (${baseline.currentWeekApplications} applications vs. ${baseline.averageWeeklyApplications} avg). You're below your baseline - consider picking up the pace.`,
        icon: 'Target',
        iconColor: 'text-yellow-500',
        createdAt: new Date(),
        metadata: {
          percentageOfBaseline: baseline.percentageOfBaseline,
          currentWeekApplications: baseline.currentWeekApplications,
          averageWeeklyApplications: baseline.averageWeeklyApplications,
        },
      });
    }
  }

  return insights;
}

/**
 * Main export: Calculate all insights for a user
 *
 * This is the main function that should be called from the server action
 */
export function calculateInsights(
  applications: Application[],
  notes: ApplicationNote[]
): InsightsResult {
  const burnout = detectBurnout(applications);
  const weeklyActivity = calculateWeeklyActivity(applications, notes);
  const baseline = calculateBaseline(applications);
  const insights = generateInsights(burnout, weeklyActivity, baseline);

  return {
    burnout,
    weeklyActivity,
    baseline,
    insights,
  };
}
