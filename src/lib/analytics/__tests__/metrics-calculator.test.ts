/**
 * Unit tests for metrics-calculator.ts
 *
 * TDD Approach: Tests written first, then implementation
 *
 * Coverage:
 * - calculateMetrics() - main metrics aggregator
 * - calculateWeekTrends() - group applications by week (last 12 weeks)
 * - calculateStatusDistribution() - count by status with percentages
 * - calculateApplicationFunnel() - conversion funnel Applied → Screening → Interview → Offer
 * - getTopCompanies() - top 5 companies by count
 * - getDateRangeFilter() - date range utility
 * - calculateWeekOverWeek() - trend indicators
 */

import { describe, it, expect } from 'vitest';
import type { Application } from '@/types/application';
import {
  calculateMetrics,
  calculateWeekTrends,
  calculateStatusDistribution,
  calculateApplicationFunnel,
  getTopCompanies,
  getDateRangeFilter,
  calculateWeekOverWeek,
} from '../metrics-calculator';

// Mock application data for tests
const createMockApplication = (overrides: Partial<Application> = {}): Application => ({
  id: 'app-' + Math.random(),
  user_id: 'user-123',
  company: 'Acme Corp',
  position: 'Software Engineer',
  status: 'applied',
  location: 'San Francisco, CA',
  work_mode: 'remote',
  salary_range: { min: 100000, max: 150000, currency: 'USD' },
  applied_date: new Date().toISOString(),
  job_url: 'https://example.com/job',
  job_description: 'Great job opportunity',
  match_score: 75,
  match_analysis: null,
  tags: [],
  next_follow_up: null,
  notes_summary: null,
  follow_up_suggestions: null,
  referral_contact_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  analyzed_at: null,
  summarized_at: null,
  followup_suggestions_at: null,
  ...overrides,
});

describe('metrics-calculator', () => {
  describe('getDateRangeFilter', () => {
    it('should return date 30 days ago for "30" filter', () => {
      const now = new Date('2026-02-01T12:00:00Z');
      const result = getDateRangeFilter('30', now);
      const expected = new Date('2026-01-02T12:00:00Z');
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should return date 60 days ago for "60" filter', () => {
      const now = new Date('2026-02-01T12:00:00Z');
      const result = getDateRangeFilter('60', now);
      const expected = new Date('2025-12-03T12:00:00Z');
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should return date 90 days ago for "90" filter', () => {
      const now = new Date('2026-02-01T12:00:00Z');
      const result = getDateRangeFilter('90', now);
      const expected = new Date('2025-11-03T12:00:00Z');
      expect(result.getTime()).toBe(expected.getTime());
    });
  });

  describe('calculateStatusDistribution', () => {
    it('should count applications by status', () => {
      const applications = [
        createMockApplication({ status: 'applied' }),
        createMockApplication({ status: 'applied' }),
        createMockApplication({ status: 'screening' }),
        createMockApplication({ status: 'interviewing' }),
        createMockApplication({ status: 'rejected' }),
      ];

      const result = calculateStatusDistribution(applications);

      expect(result).toHaveLength(4);
      expect(result.find((s) => s.status === 'applied')?.count).toBe(2);
      expect(result.find((s) => s.status === 'screening')?.count).toBe(1);
      expect(result.find((s) => s.status === 'interviewing')?.count).toBe(1);
      expect(result.find((s) => s.status === 'rejected')?.count).toBe(1);
    });

    it('should calculate correct percentages', () => {
      const applications = [
        createMockApplication({ status: 'applied' }),
        createMockApplication({ status: 'applied' }),
        createMockApplication({ status: 'screening' }),
        createMockApplication({ status: 'interviewing' }),
      ];

      const result = calculateStatusDistribution(applications);

      expect(result.find((s) => s.status === 'applied')?.percentage).toBe(50);
      expect(result.find((s) => s.status === 'screening')?.percentage).toBe(25);
      expect(result.find((s) => s.status === 'interviewing')?.percentage).toBe(25);
    });

    it('should handle empty applications array', () => {
      const result = calculateStatusDistribution([]);
      expect(result).toEqual([]);
    });

    it('should exclude statuses with zero count', () => {
      const applications = [
        createMockApplication({ status: 'applied' }),
        createMockApplication({ status: 'applied' }),
      ];

      const result = calculateStatusDistribution(applications);

      expect(result).toHaveLength(1);
      expect(result.every((s) => s.count > 0)).toBe(true);
    });
  });

  describe('calculateApplicationFunnel', () => {
    it('should calculate funnel stages correctly', () => {
      const applications = [
        createMockApplication({ status: 'applied' }),
        createMockApplication({ status: 'applied' }),
        createMockApplication({ status: 'screening' }),
        createMockApplication({ status: 'interviewing' }),
        createMockApplication({ status: 'offer' }),
        createMockApplication({ status: 'rejected' }),
      ];

      const result = calculateApplicationFunnel(applications);

      expect(result).toHaveLength(4);
      expect(result[0].stage).toBe('applied');
      expect(result[0].count).toBe(6); // All applications start as applied
      expect(result[1].stage).toBe('screening');
      expect(result[1].count).toBe(3); // screening, interviewing, offer
      expect(result[2].stage).toBe('interviewing');
      expect(result[2].count).toBe(2); // interviewing, offer
      expect(result[3].stage).toBe('offer');
      expect(result[3].count).toBe(1); // offer only
    });

    it('should calculate correct percentages for funnel', () => {
      const applications = [
        createMockApplication({ status: 'applied' }),
        createMockApplication({ status: 'applied' }),
        createMockApplication({ status: 'screening' }),
        createMockApplication({ status: 'interviewing' }),
      ];

      const result = calculateApplicationFunnel(applications);

      expect(result[0].percentage).toBe(100); // All applications
      expect(result[1].percentage).toBe(50); // 2 out of 4
      expect(result[2].percentage).toBe(25); // 1 out of 4
      expect(result[3].percentage).toBe(0); // 0 out of 4
    });

    it('should include correct labels', () => {
      const applications = [createMockApplication()];
      const result = calculateApplicationFunnel(applications);

      expect(result[0].label).toBe('Applied');
      expect(result[1].label).toBe('Screening');
      expect(result[2].label).toBe('Interviewing');
      expect(result[3].label).toBe('Offer');
    });
  });

  describe('getTopCompanies', () => {
    it('should return top 5 companies by application count', () => {
      const applications = [
        createMockApplication({ company: 'Company A' }),
        createMockApplication({ company: 'Company A' }),
        createMockApplication({ company: 'Company A' }),
        createMockApplication({ company: 'Company B' }),
        createMockApplication({ company: 'Company B' }),
        createMockApplication({ company: 'Company C' }),
        createMockApplication({ company: 'Company D' }),
        createMockApplication({ company: 'Company E' }),
        createMockApplication({ company: 'Company F' }),
      ];

      const result = getTopCompanies(applications);

      expect(result).toHaveLength(5);
      expect(result[0].company).toBe('Company A');
      expect(result[0].count).toBe(3);
      expect(result[1].company).toBe('Company B');
      expect(result[1].count).toBe(2);
    });

    it('should handle fewer than 5 companies', () => {
      const applications = [
        createMockApplication({ company: 'Company A' }),
        createMockApplication({ company: 'Company B' }),
      ];

      const result = getTopCompanies(applications);

      expect(result).toHaveLength(2);
    });

    it('should handle empty applications array', () => {
      const result = getTopCompanies([]);
      expect(result).toEqual([]);
    });
  });

  describe('calculateWeekTrends', () => {
    it('should group applications by week for last 12 weeks', () => {
      const now = new Date('2026-02-01T12:00:00Z');
      const applications = [
        createMockApplication({ applied_date: '2026-01-30T10:00:00Z' }), // Week 0
        createMockApplication({ applied_date: '2026-01-28T10:00:00Z' }), // Week 0
        createMockApplication({ applied_date: '2026-01-20T10:00:00Z' }), // Week 1
        createMockApplication({ applied_date: '2026-01-10T10:00:00Z' }), // Week 3
        createMockApplication({ applied_date: '2025-11-10T10:00:00Z' }), // Week 12 (outside range)
      ];

      const result = calculateWeekTrends(applications, now);

      expect(result).toHaveLength(12);
      expect(result[11].count).toBe(2); // Most recent week
      expect(result[10].count).toBe(1); // 1 week ago
      expect(result[8].count).toBe(1); // 3 weeks ago
    });

    it('should include week labels in format "Jan 1 - Jan 7"', () => {
      const now = new Date('2026-02-01T12:00:00Z');
      const applications = [createMockApplication({ applied_date: now.toISOString() })];

      const result = calculateWeekTrends(applications, now);

      expect(result[11].week).toMatch(/[A-Z][a-z]{2} \d{1,2} - [A-Z][a-z]{2} \d{1,2}/);
    });

    it('should handle empty applications array', () => {
      const now = new Date('2026-02-01T12:00:00Z');
      const result = calculateWeekTrends([], now);

      expect(result).toHaveLength(12);
      expect(result.every((w) => w.count === 0)).toBe(true);
    });

    it('should include timestamps for sorting', () => {
      const now = new Date('2026-02-01T12:00:00Z');
      const result = calculateWeekTrends([], now);

      expect(result[0].timestamp).toBeDefined();
      expect(result[11].timestamp).toBeDefined();
      expect(result[0].timestamp! < result[11].timestamp!).toBe(true);
    });
  });

  describe('calculateWeekOverWeek', () => {
    it('should calculate increase trend', () => {
      const applications = [
        // Last 7 days: 5 applications
        createMockApplication({ applied_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }),
        createMockApplication({ applied_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }),
        createMockApplication({ applied_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }),
        createMockApplication({ applied_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }),
        createMockApplication({ applied_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }),
        // Previous 7 days: 2 applications
        createMockApplication({ applied_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() }),
        createMockApplication({ applied_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }),
      ];

      const result = calculateWeekOverWeek(applications);

      expect(result.change).toBe(150); // (5-2)/2 * 100 = 150%
      expect(result.changeType).toBe('increase');
    });

    it('should calculate decrease trend', () => {
      const applications = [
        // Last 7 days: 2 applications
        createMockApplication({ applied_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }),
        createMockApplication({ applied_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }),
        // Previous 7 days: 5 applications
        createMockApplication({ applied_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() }),
        createMockApplication({ applied_date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() }),
        createMockApplication({ applied_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }),
        createMockApplication({ applied_date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString() }),
        createMockApplication({ applied_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() }),
      ];

      const result = calculateWeekOverWeek(applications);

      expect(result.change).toBe(-60); // (2-5)/5 * 100 = -60%
      expect(result.changeType).toBe('decrease');
    });

    it('should handle neutral trend when no previous week data', () => {
      const applications = [
        createMockApplication({ applied_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }),
      ];

      const result = calculateWeekOverWeek(applications);

      expect(result.change).toBe(0);
      expect(result.changeType).toBe('neutral');
    });

    it('should handle neutral trend when counts are equal', () => {
      const applications = [
        // Last 7 days: 2 applications
        createMockApplication({ applied_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }),
        createMockApplication({ applied_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }),
        // Previous 7 days: 2 applications
        createMockApplication({ applied_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() }),
        createMockApplication({ applied_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }),
      ];

      const result = calculateWeekOverWeek(applications);

      expect(result.change).toBe(0);
      expect(result.changeType).toBe('neutral');
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate total applications', () => {
      const applications = [
        createMockApplication(),
        createMockApplication(),
        createMockApplication(),
      ];

      const result = calculateMetrics(applications, '30');

      expect(result.metrics.totalApplications.value).toBe(3);
    });

    it('should calculate response rate correctly', () => {
      const applications = [
        createMockApplication({ status: 'applied' }),
        createMockApplication({ status: 'applied' }),
        createMockApplication({ status: 'screening' }),
        createMockApplication({ status: 'interviewing' }),
        createMockApplication({ status: 'offer' }),
        createMockApplication({ status: 'rejected' }),
      ];

      const result = calculateMetrics(applications, '30');

      // Response rate: (screening + interviewing + offer + rejected) / total = 4/6 = 66.7%
      expect(result.metrics.responseRate.value).toBe('66.7%');
    });

    it('should calculate interview rate correctly', () => {
      const applications = [
        createMockApplication({ status: 'applied' }),
        createMockApplication({ status: 'screening' }),
        createMockApplication({ status: 'interviewing' }),
        createMockApplication({ status: 'offer' }),
        createMockApplication({ status: 'accepted' }),
      ];

      const result = calculateMetrics(applications, '30');

      // Interview rate: (interviewing + offer + accepted) / total = 3/5 = 60%
      expect(result.metrics.interviewRate.value).toBe('60.0%');
    });

    it('should calculate average days to response for responded applications only', () => {
      const baseDate = new Date('2026-01-01T10:00:00Z');
      const applications = [
        createMockApplication({
          status: 'screening',
          applied_date: baseDate.toISOString(),
          updated_at: new Date('2026-01-08T10:00:00Z').toISOString(), // 7 days
        }),
        createMockApplication({
          status: 'interviewing',
          applied_date: baseDate.toISOString(),
          updated_at: new Date('2026-01-11T10:00:00Z').toISOString(), // 10 days
        }),
        createMockApplication({
          status: 'applied', // Not responded yet
          applied_date: baseDate.toISOString(),
          updated_at: baseDate.toISOString(),
        }),
      ];

      const result = calculateMetrics(applications, '30');

      // Average: (7 + 10) / 2 = 8.5 days
      expect(result.metrics.averageDaysToResponse.value).toBe(8.5);
    });

    it('should calculate average match score', () => {
      const applications = [
        createMockApplication({ match_score: 80 }),
        createMockApplication({ match_score: 90 }),
        createMockApplication({ match_score: 70 }),
        createMockApplication({ match_score: null }),
      ];

      const result = calculateMetrics(applications, '30');

      // Average: (80 + 90 + 70) / 3 = 80
      expect(result.metrics.averageMatchScore.value).toBe(80);
    });

    it('should include week trends', () => {
      const applications = [createMockApplication()];
      const result = calculateMetrics(applications, '30');

      expect(result.trends).toHaveLength(12);
    });

    it('should include status distribution', () => {
      const applications = [
        createMockApplication({ status: 'applied' }),
        createMockApplication({ status: 'screening' }),
      ];

      const result = calculateMetrics(applications, '30');

      expect(result.statusDistribution.length).toBeGreaterThan(0);
    });

    it('should include application funnel', () => {
      const applications = [createMockApplication()];
      const result = calculateMetrics(applications, '30');

      expect(result.funnel).toHaveLength(4);
    });

    it('should include top companies', () => {
      const applications = [
        createMockApplication({ company: 'Company A' }),
        createMockApplication({ company: 'Company A' }),
      ];

      const result = calculateMetrics(applications, '30');

      expect(result.topCompanies.length).toBeGreaterThan(0);
    });

    it('should include metadata', () => {
      const applications = [createMockApplication()];
      const result = calculateMetrics(applications, '30');

      expect(result.dateRange).toBe('30');
      expect(result.totalApplicationsInRange).toBe(1);
      expect(result.generatedAt).toBeDefined();
    });

    it('should handle empty applications gracefully', () => {
      const result = calculateMetrics([], '30');

      expect(result.metrics.totalApplications.value).toBe(0);
      expect(result.metrics.responseRate.value).toBe('0.0%');
      expect(result.metrics.interviewRate.value).toBe('0.0%');
      expect(result.metrics.averageDaysToResponse.value).toBe(0);
      expect(result.metrics.averageMatchScore.value).toBe(0);
    });
  });
});
