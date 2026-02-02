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

// Detection thresholds
const BURNOUT_MIN_APPLICATIONS = 10;
const BURNOUT_REJECTION_THRESHOLD = 0.8;
const BURNOUT_LOOKBACK_DAYS = 30;
const BASELINE_WEEKS = 8;
const PACING_ABOVE_THRESHOLD = 120; // 120% of baseline
const PACING_BELOW_THRESHOLD = 80;  // 80% of baseline

/**
 * Detect burnout based on rejection rate in the last 30 days
 *
 * Burnout detection criteria:
 * - At least BURNOUT_MIN_APPLICATIONS in the last BURNOUT_LOOKBACK_DAYS
 * - Rejection rate > BURNOUT_REJECTION_THRESHOLD
 * - Excludes withdrawn applications
 */
export function detectBurnout(applications: Application[]): BurnoutDetection {
  const now = new Date();
  const lookbackDate = subDays(now, BURNOUT_LOOKBACK_DAYS);

  // Filter applications from last BURNOUT_LOOKBACK_DAYS (excluding withdrawn)
  const recentApps = applications.filter((app) => {
    if (!app.created_at) return false; // Defensive null check
    const createdAt = new Date(app.created_at);
    const isRecent = createdAt >= lookbackDate;
    const notWithdrawn = app.status !== 'withdrawn';
    return isRecent && notWithdrawn;
  });

  const recentApplicationsCount = recentApps.length;
  const rejectionsCount = recentApps.filter((app) => app.status === 'rejected').length;

  // Input validation: prevent division by zero
  const rejectionRate = recentApplicationsCount > 0
    ? rejectionsCount / recentApplicationsCount
    : 0;

  // Burnout is detected if there are at least BURNOUT_MIN_APPLICATIONS and rejection rate > BURNOUT_REJECTION_THRESHOLD
  const hasHighRejectionRate =
    recentApplicationsCount >= BURNOUT_MIN_APPLICATIONS &&
    rejectionRate > BURNOUT_REJECTION_THRESHOLD;

  return {
    hasHighRejectionRate,
    rejectionRate, // Keep raw value for accuracy; rounding is done in display layer
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
 *
 * @note Status change detection has limitations:
 * - Only detects changes where updated_at differs from created_at
 * - Cannot distinguish between status changes and other field updates
 * - Multiple status changes to the same application are counted as one
 * This is a reasonable approximation given the database schema constraints.
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
    if (!app.created_at) return false; // Defensive null check
    const createdAt = new Date(app.created_at);
    return isWithinInterval(createdAt, { start: weekStart, end: weekEnd });
  });

  // Count notes created this week
  const notesThisWeek = notes.filter((note) => {
    if (!note.created_at) return false; // Defensive null check
    const createdAt = new Date(note.created_at);
    return isWithinInterval(createdAt, { start: weekStart, end: weekEnd });
  });

  // Count status changes this week
  // We detect status changes by checking if updated_at is this week and different from created_at
  const statusChanges = applications.filter((app) => {
    if (!app.updated_at || !app.created_at) return false; // Defensive null check
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
 * Calculate baseline pacing over the last BASELINE_WEEKS weeks
 *
 * Returns:
 * - Average weekly applications
 * - Number of weeks analyzed
 * - Current week applications
 * - Percentage of baseline (current week vs average)
 */
export function calculateBaseline(applications: Application[]): BaselinePacing {
  const now = new Date();
  const lookbackDate = subWeeks(now, BASELINE_WEEKS);
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

  // Get applications from last BASELINE_WEEKS weeks
  const recentApps = applications.filter((app) => {
    if (!app.created_at) return false; // Defensive null check
    const createdAt = new Date(app.created_at);
    return createdAt >= lookbackDate;
  });

  // Calculate number of weeks we have data for
  let weeksAnalyzed = BASELINE_WEEKS;
  if (recentApps.length > 0) {
    const appDates = recentApps
      .filter(app => app.created_at) // Additional null check for safety
      .map(app => new Date(app.created_at).getTime());

    // Input validation: handle empty arrays
    if (appDates.length > 0) {
      const oldestAppDate = new Date(Math.min(...appDates));
      const actualWeeks = differenceInWeeks(now, oldestAppDate);
      weeksAnalyzed = Math.min(actualWeeks + 1, BASELINE_WEEKS); // +1 to include current week
    }
  }

  // Calculate average weekly applications
  // Input validation: prevent division by zero
  const averageWeeklyApplications =
    weeksAnalyzed > 0 ? recentApps.length / weeksAnalyzed : 0;

  // Count applications in current week
  const currentWeekApplications = applications.filter((app) => {
    if (!app.created_at) return false; // Defensive null check
    const createdAt = new Date(app.created_at);
    return isWithinInterval(createdAt, { start: weekStart, end: weekEnd });
  }).length;

  // Calculate percentage of baseline
  // Input validation: prevent division by zero
  const percentageOfBaseline =
    averageWeeklyApplications > 0
      ? Math.round((currentWeekApplications / averageWeeklyApplications) * 100)
      : 0;

  return {
    averageWeeklyApplications: Math.round(averageWeeklyApplications * 10) / 10, // Standardized rounding to 1 decimal
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
      id: crypto.randomUUID(),
      type: 'burnout_warning',
      severity: 'warning',
      title: 'High Rejection Rate Detected',
      message: `You've received ${burnout.rejectionsCount} rejections out of ${burnout.recentApplicationsCount} applications (${Math.round(burnout.rejectionRate * 10) / 10 * 100}%) in the last ${BURNOUT_LOOKBACK_DAYS} days. Consider refining your approach or taking a short break.`,
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
    id: crypto.randomUUID(),
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
    const isAboveBaseline = baseline.percentageOfBaseline > PACING_ABOVE_THRESHOLD;
    const isBelowBaseline = baseline.percentageOfBaseline < PACING_BELOW_THRESHOLD;

    if (isAboveBaseline) {
      insights.push({
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
