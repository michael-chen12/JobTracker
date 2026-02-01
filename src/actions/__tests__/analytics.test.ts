/**
 * Tests for analytics server action
 *
 * Coverage:
 * - Auth checks (unauthorized, user not found)
 * - Successful analytics data fetching
 * - Error handling (database errors, calculation errors)
 * - Integration with calculateMetrics
 * - Date range parameter handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAnalytics } from '../analytics';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { calculateMetrics } from '@/lib/analytics/metrics-calculator';
import type { Application } from '@/types/application';

// Mock Supabase clients
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

// Mock metrics calculator
vi.mock('@/lib/analytics/metrics-calculator', () => ({
  calculateMetrics: vi.fn(),
}));

// Mock Next.js cache
vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn) => fn), // Return the function itself for testing
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe('getAnalytics', () => {
  const mockAuthUser = {
    id: 'auth-user-123',
    email: 'test@example.com',
  };

  const mockDbUser = {
    id: 'db-user-456',
    auth_id: 'auth-user-123',
  };

  const mockApplications: Application[] = [
    {
      id: 'app-1',
      user_id: 'db-user-456',
      company: 'Tech Corp',
      position: 'Software Engineer',
      status: 'applied',
      applied_date: '2026-01-15',
      created_at: '2026-01-15T10:00:00Z',
      updated_at: '2026-01-15T10:00:00Z',
      location: 'Remote',
      work_mode: 'remote',
      job_url: null,
      salary_min: null,
      salary_max: null,
      job_description: null,
      match_score: null,
      referral_contact_id: null,
    },
    {
      id: 'app-2',
      user_id: 'db-user-456',
      company: 'StartUp Inc',
      position: 'Senior Developer',
      status: 'interviewing',
      applied_date: '2026-01-10',
      created_at: '2026-01-10T10:00:00Z',
      updated_at: '2026-01-20T10:00:00Z',
      location: 'New York',
      work_mode: 'hybrid',
      job_url: null,
      salary_min: 120000,
      salary_max: 150000,
      job_description: null,
      match_score: 85,
      referral_contact_id: null,
    },
  ];

  const mockAnalyticsData = {
    metrics: {
      totalApplications: {
        label: 'Total Applications',
        value: 2,
        change: 0,
        changeType: 'neutral' as const,
        description: 'Total job applications submitted',
      },
      responseRate: {
        label: 'Response Rate',
        value: '50.0%',
        description: 'Applications that received a response',
      },
      interviewRate: {
        label: 'Interview Rate',
        value: '50.0%',
        description: 'Applications that led to interviews',
      },
      averageDaysToResponse: {
        label: 'Avg. Days to Response',
        value: 10,
        description: 'Average time to receive a response',
      },
      averageMatchScore: {
        label: 'Avg. Match Score',
        value: 85,
        description: 'Average job compatibility score',
      },
    },
    trends: [],
    statusDistribution: [],
    funnel: [],
    topCompanies: [],
    dateRange: '30' as const,
    generatedAt: '2026-02-01T12:00:00Z',
    totalApplicationsInRange: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return error when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Unauthorized'),
          }),
        },
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await getAnalytics('30');

      expect(result).toEqual({
        data: null,
        error: 'Unauthorized',
      });
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
    });

    it('should return error when user is null', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await getAnalytics('30');

      expect(result).toEqual({
        data: null,
        error: 'Unauthorized',
      });
    });

    it('should return error when database user is not found', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockAuthUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: new Error('User not found'),
              }),
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await getAnalytics('30');

      expect(result).toEqual({
        data: null,
        error: 'User not found',
      });
    });
  });

  describe('Successful data fetching', () => {
    it('should fetch analytics data successfully with default date range', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockAuthUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockDbUser,
                error: null,
              }),
            }),
          }),
        }),
      };

      const mockAdminSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockApplications,
              error: null,
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);
      vi.mocked(calculateMetrics).mockReturnValue(mockAnalyticsData);

      const result = await getAnalytics();

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockAnalyticsData);
      expect(calculateMetrics).toHaveBeenCalledWith(mockApplications, '30');
    });

    it('should fetch analytics data with custom date range (60 days)', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockAuthUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockDbUser,
                error: null,
              }),
            }),
          }),
        }),
      };

      const mockAdminSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockApplications,
              error: null,
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);
      vi.mocked(calculateMetrics).mockReturnValue({
        ...mockAnalyticsData,
        dateRange: '60',
      });

      const result = await getAnalytics('60');

      expect(result.error).toBeNull();
      expect(result.data?.dateRange).toBe('60');
      expect(calculateMetrics).toHaveBeenCalledWith(mockApplications, '60');
    });

    it('should fetch analytics data with custom date range (90 days)', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockAuthUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockDbUser,
                error: null,
              }),
            }),
          }),
        }),
      };

      const mockAdminSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockApplications,
              error: null,
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);
      vi.mocked(calculateMetrics).mockReturnValue({
        ...mockAnalyticsData,
        dateRange: '90',
      });

      const result = await getAnalytics('90');

      expect(result.error).toBeNull();
      expect(result.data?.dateRange).toBe('90');
      expect(calculateMetrics).toHaveBeenCalledWith(mockApplications, '90');
    });

    it('should handle empty applications array', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockAuthUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockDbUser,
                error: null,
              }),
            }),
          }),
        }),
      };

      const mockAdminSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      };

      const emptyAnalyticsData = {
        ...mockAnalyticsData,
        metrics: {
          ...mockAnalyticsData.metrics,
          totalApplications: {
            ...mockAnalyticsData.metrics.totalApplications,
            value: 0,
          },
        },
        totalApplicationsInRange: 0,
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);
      vi.mocked(calculateMetrics).mockReturnValue(emptyAnalyticsData);

      const result = await getAnalytics('30');

      expect(result.error).toBeNull();
      expect(result.data?.totalApplicationsInRange).toBe(0);
      expect(calculateMetrics).toHaveBeenCalledWith([], '30');
    });
  });

  describe('Error handling', () => {
    it('should handle database error when fetching applications', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockAuthUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockDbUser,
                error: null,
              }),
            }),
          }),
        }),
      };

      const mockAdminSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection error' },
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);

      const result = await getAnalytics('30');

      expect(result).toEqual({
        data: null,
        error: 'Database connection error',
      });
      expect(calculateMetrics).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors gracefully', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockRejectedValue(new Error('Network error')),
        },
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await getAnalytics('30');

      expect(result).toEqual({
        data: null,
        error: 'Failed to fetch analytics',
      });
    });
  });

  describe('Data integrity', () => {
    it('should verify user ownership of applications', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockAuthUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockDbUser,
                error: null,
              }),
            }),
          }),
        }),
      };

      const mockAdminSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockApplications,
              error: null,
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);
      vi.mocked(calculateMetrics).mockReturnValue(mockAnalyticsData);

      await getAnalytics('30');

      // Verify that applications are filtered by user_id
      const adminSupabaseFrom = mockAdminSupabase.from;
      expect(adminSupabaseFrom).toHaveBeenCalledWith('applications');

      const selectCall = adminSupabaseFrom().select;
      expect(selectCall).toHaveBeenCalledWith('*');

      const eqCall = selectCall().eq;
      expect(eqCall).toHaveBeenCalledWith('user_id', mockDbUser.id);
    });

    it('should return metrics data in correct format', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockAuthUser },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockDbUser,
                error: null,
              }),
            }),
          }),
        }),
      };

      const mockAdminSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockApplications,
              error: null,
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);
      vi.mocked(calculateMetrics).mockReturnValue(mockAnalyticsData);

      const result = await getAnalytics('30');

      expect(result.data).toHaveProperty('metrics');
      expect(result.data).toHaveProperty('trends');
      expect(result.data).toHaveProperty('statusDistribution');
      expect(result.data).toHaveProperty('funnel');
      expect(result.data).toHaveProperty('topCompanies');
      expect(result.data).toHaveProperty('dateRange');
      expect(result.data).toHaveProperty('generatedAt');
      expect(result.data).toHaveProperty('totalApplicationsInRange');
    });
  });
});
