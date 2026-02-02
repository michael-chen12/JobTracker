import { describe, it, expect } from 'vitest';
import { achievementConfigs, getAchievementConfig } from '../config';
import type { AchievementType } from '@/types/achievements';

describe('Achievement Configuration', () => {
  // Test all 10 achievement types exist
  it('should have configs for all 10 achievement types', () => {
    const expectedTypes: AchievementType[] = [
      'first_application',
      'milestone_10_apps',
      'milestone_25_apps',
      'milestone_50_apps',
      'first_response',
      'first_interview_any',
      'first_offer',
      'first_acceptance',
      'week_streak_3',
      'week_streak_5',
    ];

    expectedTypes.forEach((type) => {
      expect(achievementConfigs[type]).toBeDefined();
    });
  });

  // Test each config has required properties
  it('should have title, icon, color, and getMessage for each achievement', () => {
    Object.values(achievementConfigs).forEach((config) => {
      expect(config.title).toBeTruthy();
      expect(config.icon).toBeTruthy();
      expect(config.color).toBeTruthy();
      expect(typeof config.getMessage).toBe('function');
    });
  });

  // Test first_application messages
  describe('first_application', () => {
    it('should generate correct message with company and position', () => {
      const config = getAchievementConfig('first_application');
      const message = config.getMessage({
        company: 'Acme Corp',
        position: 'Software Engineer',
      });

      expect(message).toContain('Acme Corp');
      expect(message).toContain('Software Engineer');
    });

    it('should have correct icon and color', () => {
      const config = getAchievementConfig('first_application');
      expect(config.icon).toBe('Trophy');
      expect(config.color).toBe('blue');
    });
  });

  // Test milestone achievements
  describe('milestone achievements', () => {
    it('should generate messages for 10 apps milestone', () => {
      const config = getAchievementConfig('milestone_10_apps');
      const message = config.getMessage({ count: 10 });

      expect(message).toContain('10');
      expect(config.icon).toBe('Target');
    });

    it('should generate messages for 25 apps milestone', () => {
      const config = getAchievementConfig('milestone_25_apps');
      const message = config.getMessage({ count: 25 });

      expect(message).toContain('25');
      expect(config.icon).toBe('Target');
    });

    it('should generate messages for 50 apps milestone', () => {
      const config = getAchievementConfig('milestone_50_apps');
      const message = config.getMessage({ count: 50 });

      expect(message).toContain('50');
      expect(config.icon).toBe('Target');
    });
  });

  // Test status progression achievements
  describe('status progression achievements', () => {
    it('should generate message for first response', () => {
      const config = getAchievementConfig('first_response');
      const message = config.getMessage({ company: 'Google' });

      expect(message).toContain('Google');
      expect(config.icon).toBe('Mail');
    });

    it('should generate message for first interview', () => {
      const config = getAchievementConfig('first_interview_any');
      const message = config.getMessage({
        company: 'Microsoft',
        position: 'Engineer',
      });

      expect(message).toContain('Microsoft');
      expect(message).toContain('Engineer');
      expect(config.icon).toBe('Calendar');
    });

    it('should generate message for first offer', () => {
      const config = getAchievementConfig('first_offer');
      const message = config.getMessage({
        company: 'Apple',
        position: 'Developer',
      });

      expect(message).toContain('Apple');
      expect(config.icon).toBe('Briefcase');
    });

    it('should generate message for first acceptance', () => {
      const config = getAchievementConfig('first_acceptance');
      const message = config.getMessage({
        company: 'Netflix',
        position: 'Engineer',
      });

      expect(message).toContain('Netflix');
      expect(config.icon).toBe('CheckCircle2');
    });
  });

  // Test streak achievements
  describe('streak achievements', () => {
    it('should have correct config for 3-week streak', () => {
      const config = getAchievementConfig('week_streak_3');
      expect(config.icon).toBe('Flame');
      expect(config.title).toContain('3-Week');
    });

    it('should have correct config for 5-week streak', () => {
      const config = getAchievementConfig('week_streak_5');
      expect(config.icon).toBe('Flame');
      expect(config.title).toContain('5-Week');
    });
  });

  // Test getAchievementConfig function
  it('should return config for valid achievement type', () => {
    const config = getAchievementConfig('first_application');
    expect(config).toBeDefined();
    expect(config.title).toBe('First Application!');
  });
});
