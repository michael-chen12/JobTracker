import { describe, it, expect } from 'vitest';
import { subDays, subWeeks } from 'date-fns';
import {
  detectBurnout,
  calculateWeeklyActivity,
  calculateBaseline,
  generateInsights,
  calculateInsights,
} from '../calculator';
import type { Application, ApplicationNote } from '@/types/application';

describe('Insights Calculator', () => {
  describe('detectBurnout', () => {
    it('should return false for less than 10 applications', () => {
      const applications: Partial<Application>[] = Array.from({ length: 5 }, (_, i) => ({
        id: `app-${i}`,
        status: 'rejected',
        created_at: new Date().toISOString(),
      }));

      const result = detectBurnout(applications as Application[]);

      expect(result.hasHighRejectionRate).toBe(false);
      expect(result.recentApplicationsCount).toBe(5);
    });

    it('should detect high rejection rate (>80%) as burnout', () => {
      const applications: Partial<Application>[] = [
        ...Array.from({ length: 9 }, (_, i) => ({
          id: `rejected-${i}`,
          status: 'rejected' as const,
          created_at: new Date().toISOString(),
        })),
        {
          id: 'applied-1',
          status: 'applied' as const,
          created_at: new Date().toISOString(),
        },
      ];

      const result = detectBurnout(applications as Application[]);

      expect(result.hasHighRejectionRate).toBe(true);
      expect(result.rejectionRate).toBe(0.9); // 9/10 = 90%
      expect(result.rejectionsCount).toBe(9);
      expect(result.recentApplicationsCount).toBe(10);
    });

    it('should only count applications from the last 30 days', () => {
      const applications: Partial<Application>[] = [
        // Recent rejections (should count)
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `recent-${i}`,
          status: 'rejected' as const,
          created_at: subDays(new Date(), 10).toISOString(),
        })),
        // Old rejections (should NOT count)
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `old-${i}`,
          status: 'rejected' as const,
          created_at: subDays(new Date(), 40).toISOString(),
        })),
      ];

      const result = detectBurnout(applications as Application[]);

      // Should only count the 5 recent applications
      expect(result.recentApplicationsCount).toBe(5);
      expect(result.rejectionsCount).toBe(5);
      // 5 applications is below threshold, so no burnout
      expect(result.hasHighRejectionRate).toBe(false);
    });

    it('should ignore withdrawn applications when calculating rejection rate', () => {
      const applications: Partial<Application>[] = [
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `rejected-${i}`,
          status: 'rejected' as const,
          created_at: new Date().toISOString(),
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `withdrawn-${i}`,
          status: 'withdrawn' as const,
          created_at: new Date().toISOString(),
        })),
        {
          id: 'applied-1',
          status: 'applied' as const,
          created_at: new Date().toISOString(),
        },
      ];

      const result = detectBurnout(applications as Application[]);

      // Should have 11 total, but only count 6 non-withdrawn (5 rejected + 1 applied)
      expect(result.recentApplicationsCount).toBe(6);
      expect(result.rejectionsCount).toBe(5);
      expect(result.rejectionRate).toBeCloseTo(0.833, 2); // 5/6 = 83.3%
      expect(result.hasHighRejectionRate).toBe(false); // Below 10 app threshold
    });
  });

  describe('calculateWeeklyActivity', () => {
    it('should count applications and notes from current week', () => {
      const now = new Date();
      // Use dates that are guaranteed to be in the current week
      const oneDayAgo = subDays(now, 1);

      const applications: Partial<Application>[] = [
        {
          id: 'app-1',
          status: 'applied',
          created_at: now.toISOString(),
        },
        {
          id: 'app-2',
          status: 'applied',
          created_at: oneDayAgo.toISOString(),
        },
        // Old application (should NOT count)
        {
          id: 'app-3',
          status: 'applied',
          created_at: subWeeks(now, 2).toISOString(),
        },
      ];

      const notes: Partial<ApplicationNote>[] = [
        {
          id: 'note-1',
          created_at: now.toISOString(),
        },
        {
          id: 'note-2',
          created_at: oneDayAgo.toISOString(),
        },
        // Old note (should NOT count)
        {
          id: 'note-3',
          created_at: subWeeks(now, 2).toISOString(),
        },
      ];

      const result = calculateWeeklyActivity(
        applications as Application[],
        notes as ApplicationNote[]
      );

      expect(result.applications).toBe(2);
      expect(result.notes).toBe(2);
      expect(result.statusChanges).toBe(0); // All have same status
      expect(result.weekStart).toBeInstanceOf(Date);
      expect(result.weekEnd).toBeInstanceOf(Date);
    });
  });

  describe('calculateBaseline', () => {
    it('should calculate average weekly applications over 8 weeks', () => {
      const now = new Date();
      // Create 24 applications over 8 weeks (3 per week average)
      const applications: Partial<Application>[] = Array.from({ length: 24 }, (_, i) => ({
        id: `app-${i}`,
        status: 'applied',
        created_at: subDays(now, Math.floor(i / 3) * 7).toISOString(),
      }));

      const result = calculateBaseline(applications as Application[]);

      expect(result.weeksAnalyzed).toBe(8);
      expect(result.averageWeeklyApplications).toBe(3); // 24 apps / 8 weeks
      expect(result.currentWeekApplications).toBeGreaterThanOrEqual(0);
      expect(result.percentageOfBaseline).toBeGreaterThanOrEqual(0);
    });

    it('should handle less than 8 weeks of data', () => {
      const now = new Date();
      // Create 6 applications over 3 weeks (2 per week average)
      const applications: Partial<Application>[] = Array.from({ length: 6 }, (_, i) => ({
        id: `app-${i}`,
        status: 'applied',
        created_at: subDays(now, Math.floor(i / 2) * 7).toISOString(),
      }));

      const result = calculateBaseline(applications as Application[]);

      expect(result.weeksAnalyzed).toBeLessThan(8);
      expect(result.averageWeeklyApplications).toBeGreaterThan(0);
    });
  });

  describe('generateInsights', () => {
    it('should generate burnout warning insight', () => {
      const burnout = {
        hasHighRejectionRate: true,
        rejectionRate: 0.85,
        recentApplicationsCount: 12,
        rejectionsCount: 10,
      };

      const weeklyActivity = {
        applications: 5,
        notes: 3,
        statusChanges: 2,
        weekStart: new Date(),
        weekEnd: new Date(),
      };

      const baseline = {
        averageWeeklyApplications: 3,
        weeksAnalyzed: 8,
        currentWeekApplications: 5,
        percentageOfBaseline: 167,
      };

      const insights = generateInsights(burnout, weeklyActivity, baseline);

      const burnoutInsight = insights.find((i) => i.type === 'burnout_warning');
      expect(burnoutInsight).toBeDefined();
      expect(burnoutInsight?.severity).toBe('warning');
      expect(burnoutInsight?.title).toContain('High Rejection Rate');
    });

    it('should generate weekly summary insight', () => {
      const burnout = {
        hasHighRejectionRate: false,
        rejectionRate: 0.2,
        recentApplicationsCount: 10,
        rejectionsCount: 2,
      };

      const weeklyActivity = {
        applications: 5,
        notes: 3,
        statusChanges: 2,
        weekStart: new Date(),
        weekEnd: new Date(),
      };

      const baseline = {
        averageWeeklyApplications: 3,
        weeksAnalyzed: 8,
        currentWeekApplications: 5,
        percentageOfBaseline: 167,
      };

      const insights = generateInsights(burnout, weeklyActivity, baseline);

      const weeklySummary = insights.find((i) => i.type === 'weekly_summary');
      expect(weeklySummary).toBeDefined();
      expect(weeklySummary?.severity).toBe('info');
    });

    it('should generate pacing suggestion when below baseline', () => {
      const burnout = {
        hasHighRejectionRate: false,
        rejectionRate: 0.2,
        recentApplicationsCount: 10,
        rejectionsCount: 2,
      };

      const weeklyActivity = {
        applications: 1,
        notes: 1,
        statusChanges: 0,
        weekStart: new Date(),
        weekEnd: new Date(),
      };

      const baseline = {
        averageWeeklyApplications: 5,
        weeksAnalyzed: 8,
        currentWeekApplications: 1,
        percentageOfBaseline: 20, // 1/5 = 20%
      };

      const insights = generateInsights(burnout, weeklyActivity, baseline);

      const pacingSuggestion = insights.find((i) => i.type === 'pacing_suggestion');
      expect(pacingSuggestion).toBeDefined();
      expect(pacingSuggestion?.message).toContain('below');
    });

    it('should generate pacing suggestion when above baseline', () => {
      const burnout = {
        hasHighRejectionRate: false,
        rejectionRate: 0.2,
        recentApplicationsCount: 10,
        rejectionsCount: 2,
      };

      const weeklyActivity = {
        applications: 10,
        notes: 5,
        statusChanges: 3,
        weekStart: new Date(),
        weekEnd: new Date(),
      };

      const baseline = {
        averageWeeklyApplications: 3,
        weeksAnalyzed: 8,
        currentWeekApplications: 10,
        percentageOfBaseline: 333, // 10/3 = 333%
      };

      const insights = generateInsights(burnout, weeklyActivity, baseline);

      const pacingSuggestion = insights.find((i) => i.type === 'pacing_suggestion');
      expect(pacingSuggestion).toBeDefined();
      expect(pacingSuggestion?.message).toContain('above');
    });
  });

  describe('calculateInsights', () => {
    it('should return complete insights result', () => {
      const applications: Partial<Application>[] = Array.from({ length: 15 }, (_, i) => ({
        id: `app-${i}`,
        status: i < 12 ? 'rejected' : ('applied' as const),
        created_at: subDays(new Date(), i).toISOString(),
      }));

      const notes: Partial<ApplicationNote>[] = Array.from({ length: 5 }, (_, i) => ({
        id: `note-${i}`,
        created_at: subDays(new Date(), i).toISOString(),
      }));

      const result = calculateInsights(
        applications as Application[],
        notes as ApplicationNote[]
      );

      expect(result.burnout).toBeDefined();
      expect(result.weeklyActivity).toBeDefined();
      expect(result.baseline).toBeDefined();
      expect(result.insights).toBeInstanceOf(Array);
      expect(result.insights.length).toBeGreaterThan(0);
    });
  });
});
