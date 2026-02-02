import { describe, it, expect } from 'vitest';
import {
  achievementConfigs,
  getAchievementIcon,
  getAchievementIconColor,
} from '../config';
import type { AchievementType } from '@/types/achievements';

describe('Achievement Icon Configuration', () => {
  // Test that all achievements use Lucide icon names (not emojis)
  it('should use Lucide icon names instead of emojis', () => {
    Object.values(achievementConfigs).forEach((config) => {
      // Lucide icon names are PascalCase strings (e.g., "Trophy", "Target")
      expect(config.icon).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      // Should not be emoji
      expect(config.icon).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
    });
  });

  // Test that all achievements have iconColor property
  it('should have iconColor property for all achievements', () => {
    Object.values(achievementConfigs).forEach((config) => {
      expect(config.iconColor).toBeDefined();
      // Should be a Tailwind color class (e.g., "text-blue-500")
      expect(config.iconColor).toMatch(/^text-\w+-\d{3}$/);
    });
  });

  // Test specific icon mappings
  describe('Icon mappings', () => {
    it('should map first_application to Trophy icon', () => {
      expect(achievementConfigs.first_application.icon).toBe('Trophy');
      expect(achievementConfigs.first_application.iconColor).toBe('text-blue-500');
    });

    it('should map milestone achievements to Target icon', () => {
      expect(achievementConfigs.milestone_10_apps.icon).toBe('Target');
      expect(achievementConfigs.milestone_10_apps.iconColor).toBe('text-orange-500');

      expect(achievementConfigs.milestone_25_apps.icon).toBe('Target');
      expect(achievementConfigs.milestone_25_apps.iconColor).toBe('text-purple-500');

      expect(achievementConfigs.milestone_50_apps.icon).toBe('Target');
      expect(achievementConfigs.milestone_50_apps.iconColor).toBe('text-green-500');
    });

    it('should map first_response to Mail icon', () => {
      expect(achievementConfigs.first_response.icon).toBe('Mail');
      expect(achievementConfigs.first_response.iconColor).toBe('text-teal-500');
    });

    it('should map first_interview_any to Calendar icon', () => {
      expect(achievementConfigs.first_interview_any.icon).toBe('Calendar');
      expect(achievementConfigs.first_interview_any.iconColor).toBe('text-indigo-500');
    });

    it('should map first_offer to Briefcase icon', () => {
      expect(achievementConfigs.first_offer.icon).toBe('Briefcase');
      expect(achievementConfigs.first_offer.iconColor).toBe('text-pink-500');
    });

    it('should map first_acceptance to CheckCircle2 icon', () => {
      expect(achievementConfigs.first_acceptance.icon).toBe('CheckCircle2');
      expect(achievementConfigs.first_acceptance.iconColor).toBe('text-yellow-500');
    });

    it('should map streak achievements to Flame icon', () => {
      expect(achievementConfigs.week_streak_3.icon).toBe('Flame');
      expect(achievementConfigs.week_streak_3.iconColor).toBe('text-cyan-500');

      expect(achievementConfigs.week_streak_5.icon).toBe('Flame');
      expect(achievementConfigs.week_streak_5.iconColor).toBe('text-violet-500');
    });
  });

  // Test helper functions
  describe('Helper functions', () => {
    it('getAchievementIcon should return correct icon name', () => {
      expect(getAchievementIcon('first_application')).toBe('Trophy');
      expect(getAchievementIcon('milestone_10_apps')).toBe('Target');
      expect(getAchievementIcon('first_response')).toBe('Mail');
      expect(getAchievementIcon('first_interview_any')).toBe('Calendar');
      expect(getAchievementIcon('first_offer')).toBe('Briefcase');
      expect(getAchievementIcon('first_acceptance')).toBe('CheckCircle2');
      expect(getAchievementIcon('week_streak_3')).toBe('Flame');
    });

    it('getAchievementIconColor should return correct Tailwind color class', () => {
      expect(getAchievementIconColor('first_application')).toBe('text-blue-500');
      expect(getAchievementIconColor('milestone_10_apps')).toBe('text-orange-500');
      expect(getAchievementIconColor('milestone_25_apps')).toBe('text-purple-500');
      expect(getAchievementIconColor('milestone_50_apps')).toBe('text-green-500');
      expect(getAchievementIconColor('first_response')).toBe('text-teal-500');
      expect(getAchievementIconColor('first_interview_any')).toBe('text-indigo-500');
      expect(getAchievementIconColor('first_offer')).toBe('text-pink-500');
      expect(getAchievementIconColor('first_acceptance')).toBe('text-yellow-500');
      expect(getAchievementIconColor('week_streak_3')).toBe('text-cyan-500');
      expect(getAchievementIconColor('week_streak_5')).toBe('text-violet-500');
    });
  });
});
