import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AnalyticsData } from '@/types/analytics';
import type { InsightsResult } from '@/types/insights';
import AnalyticsPage from '../page';

const mockCreateClient = vi.fn();
const mockGetAnalytics = vi.fn();
const mockGetInsights = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock('@/actions/analytics', () => ({
  getAnalytics: (...args: unknown[]) => mockGetAnalytics(...args),
}));

vi.mock('@/actions/insights', () => ({
  getInsights: (...args: unknown[]) => mockGetInsights(...args),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

const analyticsFixture: AnalyticsData = {
  metrics: {
    totalApplications: { label: 'Total Applications', value: 10, change: 5 },
    responseRate: { label: 'Response Rate', value: '40%', change: 10 },
    interviewRate: { label: 'Interview Rate', value: '20%', change: 2 },
    averageDaysToResponse: { label: 'Avg Days', value: 7 },
    averageMatchScore: { label: 'Avg Match', value: 82 },
  },
  trends: [],
  statusDistribution: [],
  funnel: [],
  topCompanies: [],
  dateRange: 'all',
  generatedAt: '2026-01-01T00:00:00.000Z',
  totalApplicationsInRange: 10,
};

const insightsFixture: InsightsResult = {
  burnout: {
    hasHighRejectionRate: false,
    rejectionRate: 0,
    recentApplicationsCount: 2,
    rejectionsCount: 0,
  },
  weeklyActivity: {
    applications: 2,
    notes: 1,
    statusChanges: 1,
    weekStart: new Date('2026-01-05T00:00:00.000Z'),
    weekEnd: new Date('2026-01-11T23:59:59.000Z'),
  },
  baseline: {
    averageWeeklyApplications: 3,
    weeksAnalyzed: 8,
    currentWeekApplications: 2,
    percentageOfBaseline: 67,
  },
  insights: [],
};

describe('AnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'auth-user-1',
              email: 'analytics@example.com',
              user_metadata: {},
            },
          },
        }),
      },
    });
  });

  it('prefetches analytics and insights in parallel and forwards both to AnalyticsDashboard', async () => {
    mockGetAnalytics.mockResolvedValue({ data: analyticsFixture, error: null });
    mockGetInsights.mockResolvedValue({ data: insightsFixture, error: null });

    const element = await AnalyticsPage();

    expect(mockGetAnalytics).toHaveBeenCalledWith('all');
    expect(mockGetInsights).toHaveBeenCalledWith();

    const props = (element as { props: Record<string, unknown> }).props;
    expect(props.initialData).toEqual(analyticsFixture);
    expect(props.initialRange).toBe('all');
    expect(props.initialInsights).toEqual(insightsFixture);
  });

  it('passes null insights when insights fetching fails', async () => {
    mockGetAnalytics.mockResolvedValue({ data: analyticsFixture, error: null });
    mockGetInsights.mockResolvedValue({ data: null, error: 'Insights failed' });

    const element = await AnalyticsPage();

    const props = (element as { props: Record<string, unknown> }).props;
    expect(props.initialInsights).toBeNull();
  });
});
