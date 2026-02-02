// Activity insights and burnout detection types

import type { Achievement } from './achievements';

/**
 * Insight type enum
 */
export type InsightType =
  | 'burnout_warning' // High rejection rate
  | 'weekly_summary' // This week's activity summary
  | 'pacing_suggestion'; // Optimal pacing based on baseline

/**
 * Insight severity levels
 */
export type InsightSeverity = 'info' | 'warning' | 'critical';

/**
 * Burnout detection result
 */
export interface BurnoutDetection {
  hasHighRejectionRate: boolean;
  rejectionRate: number; // 0.0 to 1.0
  recentApplicationsCount: number;
  rejectionsCount: number;
}

/**
 * Weekly activity metrics
 */
export interface WeeklyActivity {
  applications: number;
  notes: number;
  statusChanges: number;
  weekStart: Date;
  weekEnd: Date;
}

/**
 * Baseline pacing calculation
 */
export interface BaselinePacing {
  averageWeeklyApplications: number;
  weeksAnalyzed: number;
  currentWeekApplications: number;
  percentageOfBaseline: number; // 150 means 150% of baseline
}

/**
 * Insight item (displayed in Your Journey section)
 */
export interface InsightItem {
  id: string; // Generated unique ID
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  message: string;
  icon: string; // Lucide React icon name
  iconColor: string; // Tailwind color class
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Journey item - unified type for wins + insights
 */
export type JourneyItem =
  | { type: 'achievement'; data: Achievement }
  | { type: 'insight'; data: InsightItem };

/**
 * Insights calculation result
 */
export interface InsightsResult {
  burnout: BurnoutDetection;
  weeklyActivity: WeeklyActivity;
  baseline: BaselinePacing;
  insights: InsightItem[];
}
