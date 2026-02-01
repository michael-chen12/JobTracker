import { ApplicationStatus } from './application';

// Date range filter options
export type DateRangeFilter = '30' | '60' | '90' | 'all';

// Metrics card data structure
export interface MetricsCardData {
  label: string;
  value: number | string;
  change?: number; // Percentage change from previous period
  changeType?: 'increase' | 'decrease' | 'neutral';
  description?: string; // Optional tooltip/help text
}

// Application trend data for bar/line charts
export interface ApplicationTrendData {
  week: string; // Format: "Jan 1 - Jan 7" or "Week 1"
  count: number;
  timestamp?: number; // Unix timestamp for sorting
}

// Status distribution for pie chart
export interface StatusDistribution {
  status: ApplicationStatus;
  count: number;
  percentage: number;
  color: string; // Chart color for this status
}

// Application funnel stages
export type FunnelStage = 'applied' | 'screening' | 'interviewing' | 'offer';

export interface ApplicationFunnel {
  stage: FunnelStage;
  count: number;
  percentage: number;
  label: string; // Display name for the stage
  conversionRate?: number; // Conversion rate to next stage
}

// Top companies data
export interface TopCompany {
  company: string;
  count: number;
}

// Aggregated analytics data structure
export interface AnalyticsData {
  // Key metrics
  metrics: {
    totalApplications: MetricsCardData;
    responseRate: MetricsCardData;
    interviewRate: MetricsCardData;
    averageDaysToResponse: MetricsCardData;
    averageMatchScore: MetricsCardData;
  };

  // Trend data (last 12 weeks)
  trends: ApplicationTrendData[];

  // Status distribution
  statusDistribution: StatusDistribution[];

  // Application funnel
  funnel: ApplicationFunnel[];

  // Top companies
  topCompanies: TopCompany[];

  // Date range used for calculations
  dateRange: DateRangeFilter;

  // Metadata
  generatedAt: string; // ISO timestamp
  totalApplicationsInRange: number;
}

// Filter options for analytics
export interface AnalyticsFilters {
  dateRange: DateRangeFilter;
  status?: ApplicationStatus[];
  company?: string[];
}
