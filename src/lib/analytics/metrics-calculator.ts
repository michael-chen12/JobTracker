/**
 * Analytics Metrics Calculator
 *
 * Server-side calculation functions for dashboard analytics.
 * All functions are pure and testable.
 *
 * Key metrics:
 * - Total applications
 * - Response rate: (screening + interviewing + offer + accepted + rejected) / total
 * - Interview rate: (interviewing + offer + accepted) / total
 * - Average days to response: for responded applications only
 * - Average match score: across all applications with scores
 *
 * Data aggregations:
 * - Week trends: last 12 weeks
 * - Status distribution: count by status with percentages
 * - Application funnel: Applied → Screening → Interview → Offer
 * - Top companies: top 5 by count
 * - Week-over-week: compare last 7 days vs previous 7 days
 */

import type { Application, ApplicationStatus } from '@/types/application';
import type {
  AnalyticsData,
  MetricsCardData,
  ApplicationTrendData,
  StatusDistribution,
  ApplicationFunnel,
  TopCompany,
  DateRangeFilter,
} from '@/types/analytics';

/**
 * Get color for application status in charts
 * Uses hsl values from globals.css chart colors
 */
function getStatusColor(status: ApplicationStatus): string {
  const colorMap: Record<ApplicationStatus, string> = {
    bookmarked: 'hsl(var(--chart-4))', // Yellow/amber
    applied: 'hsl(var(--chart-1))', // Primary color
    screening: 'hsl(var(--chart-2))', // Teal
    interviewing: 'hsl(var(--chart-5))', // Orange/coral
    offer: 'hsl(var(--chart-3))', // Green
    accepted: '#22c55e', // Bright green
    rejected: '#ef4444', // Red
    withdrawn: '#6b7280', // Gray
  };
  return colorMap[status];
}

/**
 * Get date threshold for filtering applications based on date range
 * Returns null for 'all' to indicate no date filtering
 */
export function getDateRangeFilter(range: DateRangeFilter, now: Date = new Date()): Date | null {
  if (range === 'all') {
    return null;
  }
  const days = parseInt(range, 10);
  const threshold = new Date(now);
  threshold.setDate(threshold.getDate() - days);
  return threshold;
}

/**
 * Calculate status distribution with counts and percentages
 */
export function calculateStatusDistribution(applications: Application[]): StatusDistribution[] {
  if (applications.length === 0) return [];

  const statusCounts = new Map<ApplicationStatus, number>();

  // Count applications by status
  applications.forEach((app) => {
    const status = app.status as ApplicationStatus;
    const count = statusCounts.get(status) || 0;
    statusCounts.set(status, count + 1);
  });

  // Convert to array with percentages
  const distribution: StatusDistribution[] = [];
  const total = applications.length;

  statusCounts.forEach((count, status) => {
    if (count > 0) {
      distribution.push({
        status,
        count,
        percentage: Math.round((count / total) * 100 * 10) / 10, // Round to 1 decimal
        color: getStatusColor(status),
      });
    }
  });

  return distribution;
}

/**
 * Calculate application funnel stages
 * Funnel shows cumulative progression: Applied → Screening → Interviewing → Offer
 */
export function calculateApplicationFunnel(applications: Application[]): ApplicationFunnel[] {
  const total = applications.length;

  // Count applications that reached each stage
  const appliedCount = total; // All applications start as applied
  const screeningCount = applications.filter((app) =>
    ['screening', 'interviewing', 'offer', 'accepted'].includes(app.status)
  ).length;
  const interviewingCount = applications.filter((app) =>
    ['interviewing', 'offer', 'accepted'].includes(app.status)
  ).length;
  const offerCount = applications.filter((app) => ['offer', 'accepted'].includes(app.status)).length;

  return [
    {
      stage: 'applied',
      count: appliedCount,
      percentage: total > 0 ? 100 : 0,
      label: 'Applied',
      conversionRate: appliedCount > 0 ? Math.round((screeningCount / appliedCount) * 100) : 0,
    },
    {
      stage: 'screening',
      count: screeningCount,
      percentage: total > 0 ? Math.round((screeningCount / total) * 100 * 10) / 10 : 0,
      label: 'Screening',
      conversionRate: screeningCount > 0 ? Math.round((interviewingCount / screeningCount) * 100) : 0,
    },
    {
      stage: 'interviewing',
      count: interviewingCount,
      percentage: total > 0 ? Math.round((interviewingCount / total) * 100 * 10) / 10 : 0,
      label: 'Interviewing',
      conversionRate: interviewingCount > 0 ? Math.round((offerCount / interviewingCount) * 100) : 0,
    },
    {
      stage: 'offer',
      count: offerCount,
      percentage: total > 0 ? Math.round((offerCount / total) * 100 * 10) / 10 : 0,
      label: 'Offer',
    },
  ];
}

/**
 * Get top companies by application count (max 5)
 */
export function getTopCompanies(applications: Application[]): TopCompany[] {
  if (applications.length === 0) return [];

  const companyCounts = new Map<string, number>();

  // Count applications per company
  applications.forEach((app) => {
    const count = companyCounts.get(app.company) || 0;
    companyCounts.set(app.company, count + 1);
  });

  // Convert to array and sort by count descending
  const topCompanies = Array.from(companyCounts.entries())
    .map(([company, count]) => ({ company, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 only

  return topCompanies;
}

/**
 * Calculate week trends for last 12 weeks
 * Groups applications by week and returns count per week
 */
export function calculateWeekTrends(
  applications: Application[],
  now: Date = new Date()
): ApplicationTrendData[] {
  const trends: ApplicationTrendData[] = [];

  // Generate last 12 weeks
  for (let weekIndex = 0; weekIndex < 12; weekIndex++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - weekIndex * 7);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);

    // Format week label
    const weekLabel = formatWeekLabel(weekStart, weekEnd);

    // Count applications in this week
    const count = applications.filter((app) => {
      if (!app.applied_date) return false;
      const appliedDate = new Date(app.applied_date);
      return appliedDate >= weekStart && appliedDate <= weekEnd;
    }).length;

    trends.unshift({
      week: weekLabel,
      count,
      timestamp: weekStart.getTime(),
    });
  }

  return trends;
}

/**
 * Format week label as "Jan 1 - Jan 7"
 */
function formatWeekLabel(start: Date, end: Date): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const startMonth = monthNames[start.getMonth()];
  const startDay = start.getDate();
  const endMonth = monthNames[end.getMonth()];
  const endDay = end.getDate();

  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

/**
 * Calculate week-over-week trend
 * Compares last 7 days vs previous 7 days
 */
export function calculateWeekOverWeek(
  applications: Application[],
  now: Date = new Date()
): { change: number; changeType: 'increase' | 'decrease' | 'neutral' } {
  const last7DaysStart = new Date(now);
  last7DaysStart.setDate(last7DaysStart.getDate() - 7);

  const previous7DaysStart = new Date(now);
  previous7DaysStart.setDate(previous7DaysStart.getDate() - 14);

  const previous7DaysEnd = new Date(now);
  previous7DaysEnd.setDate(previous7DaysEnd.getDate() - 7);

  // Count applications in last 7 days
  const last7DaysCount = applications.filter((app) => {
    if (!app.applied_date) return false;
    const appliedDate = new Date(app.applied_date);
    return appliedDate >= last7DaysStart && appliedDate <= now;
  }).length;

  // Count applications in previous 7 days
  const previous7DaysCount = applications.filter((app) => {
    if (!app.applied_date) return false;
    const appliedDate = new Date(app.applied_date);
    return appliedDate >= previous7DaysStart && appliedDate < previous7DaysEnd;
  }).length;

  // Calculate percentage change
  let change = 0;
  let changeType: 'increase' | 'decrease' | 'neutral' = 'neutral';

  if (previous7DaysCount > 0) {
    change = Math.round(((last7DaysCount - previous7DaysCount) / previous7DaysCount) * 100);
    if (change > 0) {
      changeType = 'increase';
    } else if (change < 0) {
      changeType = 'decrease';
    }
  } else if (last7DaysCount > 0) {
    // No previous data but have current data
    changeType = 'neutral';
  }

  return { change, changeType };
}

/**
 * Calculate average days to response
 * Only includes applications that have received a response (screening, interviewing, offer, rejected, accepted)
 */
function calculateAverageDaysToResponse(applications: Application[]): number {
  const respondedApps = applications.filter(
    (app) =>
      ['screening', 'interviewing', 'offer', 'rejected', 'accepted'].includes(app.status) && app.applied_date
  );

  if (respondedApps.length === 0) return 0;

  const totalDays = respondedApps.reduce((sum, app) => {
    if (!app.applied_date) return sum;
    const appliedDate = new Date(app.applied_date);
    const responseDate = new Date(app.updated_at);
    const days = Math.floor((responseDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
    return sum + Math.max(0, days); // Ensure non-negative
  }, 0);

  return Math.round((totalDays / respondedApps.length) * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate average match score
 * Only includes applications with non-null match_score
 */
function calculateAverageMatchScore(applications: Application[]): number {
  const appsWithScores = applications.filter((app) => app.match_score !== null);

  if (appsWithScores.length === 0) return 0;

  const totalScore = appsWithScores.reduce((sum, app) => sum + (app.match_score || 0), 0);
  return Math.round(totalScore / appsWithScores.length);
}

/**
 * Main metrics calculator
 * Aggregates all analytics data for dashboard
 */
export function calculateMetrics(applications: Application[], dateRange: DateRangeFilter): AnalyticsData {
  const total = applications.length;

  // Calculate response rate: applications that moved beyond "applied" or "bookmarked"
  const respondedApps = applications.filter((app) =>
    ['screening', 'interviewing', 'offer', 'rejected', 'accepted'].includes(app.status)
  ).length;
  const responseRate = total > 0 ? ((respondedApps / total) * 100).toFixed(1) : '0.0';

  // Calculate interview rate: applications that reached interviewing stage or beyond
  const interviewedApps = applications.filter((app) =>
    ['interviewing', 'offer', 'accepted'].includes(app.status)
  ).length;
  const interviewRate = total > 0 ? ((interviewedApps / total) * 100).toFixed(1) : '0.0';

  // Calculate average days to response
  const avgDaysToResponse = calculateAverageDaysToResponse(applications);

  // Calculate average match score
  const avgMatchScore = calculateAverageMatchScore(applications);

  // Get week-over-week change for total applications
  const weekOverWeek = calculateWeekOverWeek(applications);

  // Build metrics cards
  const metrics = {
    totalApplications: {
      label: 'Total Applications',
      value: total,
      change: weekOverWeek.change,
      changeType: weekOverWeek.changeType,
      description: 'Total job applications submitted',
    } as MetricsCardData,
    responseRate: {
      label: 'Response Rate',
      value: `${responseRate}%`,
      description: 'Applications that received a response',
    } as MetricsCardData,
    interviewRate: {
      label: 'Interview Rate',
      value: `${interviewRate}%`,
      description: 'Applications that led to interviews',
    } as MetricsCardData,
    averageDaysToResponse: {
      label: 'Avg. Days to Response',
      value: avgDaysToResponse,
      description: 'Average time to receive a response',
    } as MetricsCardData,
    averageMatchScore: {
      label: 'Avg. Match Score',
      value: avgMatchScore,
      description: 'Average job compatibility score',
    } as MetricsCardData,
  };

  // Calculate aggregated data
  const trends = calculateWeekTrends(applications);
  const statusDistribution = calculateStatusDistribution(applications);
  const funnel = calculateApplicationFunnel(applications);
  const topCompanies = getTopCompanies(applications);

  return {
    metrics,
    trends,
    statusDistribution,
    funnel,
    topCompanies,
    dateRange,
    generatedAt: new Date().toISOString(),
    totalApplicationsInRange: total,
  };
}
