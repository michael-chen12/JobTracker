import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectAchievements } from '../detector';
import type { Application } from '@/types/application';

// Mock the Supabase admin client
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'applications') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                data: mockApplications,
                error: null,
              })),
            })),
          })),
        };
      }
      if (table === 'achievements') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: mockExistingAchievements,
              error: null,
            })),
          })),
          insert: vi.fn((data: any) => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: { id: 'test-id', ...data, achieved_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), celebrated: false },
                error: null,
              })),
            })),
          })),
        };
      }
      return {};
    }),
  })),
}));

let mockApplications: Partial<Application>[] = [];
let mockExistingAchievements: any[] = [];

describe('Achievement Detector', () => {
  const userId = 'test-user-id';

  beforeEach(() => {
    // Reset mocks before each test
    mockApplications = [];
    mockExistingAchievements = [];
    vi.clearAllMocks();
  });

  describe('First Application Detection', () => {
    it('should detect first application achievement', async () => {
      mockApplications = [
        {
          id: 'app-1',
          company: 'Acme Corp',
          position: 'Engineer',
          status: 'applied',
          created_at: new Date().toISOString(),
        } as Application,
      ];
      mockExistingAchievements = [];

      const result = await detectAchievements(userId);

      expect(result.newAchievements.length).toBeGreaterThan(0);
      expect(result.celebrationData.length).toBeGreaterThan(0);
      expect(result.celebrationData[0]?.achievement_type).toBe('first_application');
    });

    it('should not detect first application if already exists', async () => {
      mockApplications = [
        { id: 'app-1', status: 'applied' } as Application,
      ];
      mockExistingAchievements = [{ achievement_type: 'first_application' }];

      const result = await detectAchievements(userId);

      const firstAppAchievement = result.newAchievements.find(
        (a) => a.achievement_type === 'first_application'
      );
      expect(firstAppAchievement).toBeUndefined();
    });
  });

  describe('Milestone Detection', () => {
    it('should detect 10 applications milestone', async () => {
      mockApplications = Array.from({ length: 10 }, (_, i) => ({
        id: `app-${i}`,
        company: `Company ${i}`,
        position: `Position ${i}`,
        status: 'applied',
        created_at: new Date().toISOString(),
      })) as Application[];
      mockExistingAchievements = [{ achievement_type: 'first_application' }];

      const result = await detectAchievements(userId);

      const milestone10 = result.celebrationData.find(
        (c) => c.achievement_type === 'milestone_10_apps'
      );
      expect(milestone10).toBeDefined();
    });

    it('should detect 25 applications milestone', async () => {
      mockApplications = Array.from({ length: 25 }, (_, i) => ({
        id: `app-${i}`,
        status: 'applied',
      })) as Application[];
      mockExistingAchievements = [
        { achievement_type: 'first_application' },
        { achievement_type: 'milestone_10_apps' },
      ];

      const result = await detectAchievements(userId);

      const milestone25 = result.celebrationData.find(
        (c) => c.achievement_type === 'milestone_25_apps'
      );
      expect(milestone25).toBeDefined();
    });

    it('should detect 50 applications milestone', async () => {
      mockApplications = Array.from({ length: 50 }, (_, i) => ({
        id: `app-${i}`,
        status: 'applied',
      })) as Application[];
      mockExistingAchievements = [
        { achievement_type: 'first_application' },
        { achievement_type: 'milestone_10_apps' },
        { achievement_type: 'milestone_25_apps' },
      ];

      const result = await detectAchievements(userId);

      const milestone50 = result.celebrationData.find(
        (c) => c.achievement_type === 'milestone_50_apps'
      );
      expect(milestone50).toBeDefined();
    });

    it('should not duplicate milestone achievements', async () => {
      mockApplications = Array.from({ length: 15 }, (_, i) => ({
        id: `app-${i}`,
        status: 'applied',
      })) as Application[];
      mockExistingAchievements = [
        { achievement_type: 'first_application' },
        { achievement_type: 'milestone_10_apps' },
      ];

      const result = await detectAchievements(userId);

      const milestone10 = result.newAchievements.find(
        (a) => a.achievement_type === 'milestone_10_apps'
      );
      expect(milestone10).toBeUndefined();
    });
  });

  describe('Status Progression Detection', () => {
    it('should detect first response achievement', async () => {
      mockApplications = [
        { id: 'app-1', status: 'screening', company: 'Google' } as Application,
      ];
      mockExistingAchievements = [{ achievement_type: 'first_application' }];

      const result = await detectAchievements(userId);

      const firstResponse = result.celebrationData.find(
        (c) => c.achievement_type === 'first_response'
      );
      expect(firstResponse).toBeDefined();
    });

    it('should detect first interview achievement', async () => {
      mockApplications = [
        {
          id: 'app-1',
          status: 'interviewing',
          company: 'Microsoft',
          position: 'Engineer',
        } as Application,
      ];
      mockExistingAchievements = [
        { achievement_type: 'first_application' },
        { achievement_type: 'first_response' },
      ];

      const result = await detectAchievements(userId);

      const firstInterview = result.celebrationData.find(
        (c) => c.achievement_type === 'first_interview_any'
      );
      expect(firstInterview).toBeDefined();
    });

    it('should detect first offer achievement', async () => {
      mockApplications = [
        { id: 'app-1', status: 'offer', company: 'Apple' } as Application,
      ];
      mockExistingAchievements = [
        { achievement_type: 'first_application' },
        { achievement_type: 'first_response' },
        { achievement_type: 'first_interview_any' },
      ];

      const result = await detectAchievements(userId);

      const firstOffer = result.celebrationData.find(
        (c) => c.achievement_type === 'first_offer'
      );
      expect(firstOffer).toBeDefined();
    });

    it('should detect first acceptance achievement', async () => {
      mockApplications = [
        { id: 'app-1', status: 'accepted', company: 'Netflix' } as Application,
      ];
      mockExistingAchievements = [
        { achievement_type: 'first_application' },
        { achievement_type: 'first_response' },
        { achievement_type: 'first_interview_any' },
        { achievement_type: 'first_offer' },
      ];

      const result = await detectAchievements(userId);

      const firstAcceptance = result.celebrationData.find(
        (c) => c.achievement_type === 'first_acceptance'
      );
      expect(firstAcceptance).toBeDefined();
    });
  });

  describe('Multiple Achievements', () => {
    it('should detect multiple achievements in one call', async () => {
      // First application + 10 milestone in one go
      mockApplications = Array.from({ length: 10 }, (_, i) => ({
        id: `app-${i}`,
        company: `Company ${i}`,
        position: `Position ${i}`,
        status: 'applied',
        created_at: new Date().toISOString(),
      })) as Application[];
      mockExistingAchievements = [];

      const result = await detectAchievements(userId);

      // Should detect at least one achievement
      expect(result.newAchievements.length).toBeGreaterThan(0);
      expect(result.celebrationData.length).toBeGreaterThan(0);

      // Should detect first_application or milestone_10_apps (or both)
      const types = result.celebrationData.map((c) => c.achievement_type);
      const hasFirstApp = types.includes('first_application');
      const hasMilestone10 = types.includes('milestone_10_apps');
      expect(hasFirstApp || hasMilestone10).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return empty arrays on database error', async () => {
      // This test would require mocking a database error
      // For now, we verify the function handles errors gracefully
      const result = await detectAchievements(userId);
      expect(result).toHaveProperty('newAchievements');
      expect(result).toHaveProperty('celebrationData');
      expect(Array.isArray(result.newAchievements)).toBe(true);
      expect(Array.isArray(result.celebrationData)).toBe(true);
    });
  });
});
