// Achievement configuration - defines UI properties for each achievement type
import type { AchievementType, AchievementMetadata } from '@/types/achievements';

/**
 * Configuration for a single achievement type
 */
export interface AchievementConfig {
  title: string; // Display title (e.g., "First Application!")
  icon: string; // Lucide React icon name (e.g., "Trophy", "Target")
  iconColor: string; // Tailwind color class (e.g., "text-blue-500")
  color: string; // Tailwind color name (e.g., "blue")
  getMessage: (metadata: AchievementMetadata) => string; // Generate message based on metadata
}

/**
 * Achievement configurations map - defines all 10 achievement types
 */
export const achievementConfigs: Record<AchievementType, AchievementConfig> = {
  // First application
  first_application: {
    title: 'First Application!',
    icon: 'Trophy',
    iconColor: 'text-blue-500',
    color: 'blue',
    getMessage: (metadata) => {
      const company = metadata.company || 'a company';
      const position = metadata.position || 'a position';
      return `Great job! You created your first application for ${position} at ${company}. This is the beginning of your journey!`;
    },
  },

  // 10 applications milestone
  milestone_10_apps: {
    title: '10 Applications Milestone!',
    icon: 'Target',
    iconColor: 'text-orange-500',
    color: 'orange',
    getMessage: () => {
      return `Amazing! You've reached 10 applications. You're building momentum!`;
    },
  },

  // 25 applications milestone
  milestone_25_apps: {
    title: '25 Applications Milestone!',
    icon: 'Target',
    iconColor: 'text-purple-500',
    color: 'purple',
    getMessage: () => {
      return `Incredible! You've submitted 25 applications. Your persistence is paying off!`;
    },
  },

  // 50 applications milestone
  milestone_50_apps: {
    title: '50 Applications Milestone!',
    icon: 'Target',
    iconColor: 'text-green-500',
    color: 'green',
    getMessage: () => {
      return `Outstanding! You've reached 50 applications. You're a job search champion!`;
    },
  },

  // First response from a company
  first_response: {
    title: 'First Response!',
    icon: 'Mail',
    iconColor: 'text-teal-500',
    color: 'teal',
    getMessage: (metadata) => {
      const company = metadata.company || 'a company';
      return `Exciting! ${company} responded to your application. Your efforts are being noticed!`;
    },
  },

  // First interview scheduled
  first_interview_any: {
    title: 'First Interview Scheduled!',
    icon: 'Calendar',
    iconColor: 'text-indigo-500',
    color: 'indigo',
    getMessage: (metadata) => {
      const company = metadata.company || 'a company';
      const position = metadata.position || 'the position';
      return `Congratulations! You got your first interview for ${position} at ${company}. You've got this!`;
    },
  },

  // First offer received
  first_offer: {
    title: 'First Offer!',
    icon: 'Briefcase',
    iconColor: 'text-pink-500',
    color: 'pink',
    getMessage: (metadata) => {
      const company = metadata.company || 'a company';
      const position = metadata.position || 'a position';
      return `Wow! You received your first job offer for ${position} at ${company}! All your hard work paid off!`;
    },
  },

  // First acceptance
  first_acceptance: {
    title: 'First Acceptance!',
    icon: 'CheckCircle2',
    iconColor: 'text-yellow-500',
    color: 'yellow',
    getMessage: (metadata) => {
      const company = metadata.company || 'a company';
      const position = metadata.position || 'a position';
      return `Congratulations! You accepted the offer for ${position} at ${company}! Welcome to your new role!`;
    },
  },

  // 3-week streak
  week_streak_3: {
    title: '3-Week Streak!',
    icon: 'Flame',
    iconColor: 'text-cyan-500',
    color: 'cyan',
    getMessage: () => {
      return `You're on fire! You've applied consistently for 3 weeks straight. Keep the momentum going!`;
    },
  },

  // 5-week streak
  week_streak_5: {
    title: '5-Week Streak!',
    icon: 'Flame',
    iconColor: 'text-violet-500',
    color: 'violet',
    getMessage: () => {
      return `Unstoppable! You've maintained a 5-week application streak. Your dedication is inspiring!`;
    },
  },
};

/**
 * Get configuration for an achievement type
 * @param type - The achievement type
 * @returns Configuration object with title, icon, color, and message generator
 */
export function getAchievementConfig(type: AchievementType): AchievementConfig {
  return achievementConfigs[type];
}

/**
 * Get the Lucide React icon name for an achievement type
 * @param type - The achievement type
 * @returns Lucide icon name (e.g., "Trophy", "Target", "Mail")
 */
export function getAchievementIcon(type: AchievementType): string {
  return achievementConfigs[type].icon;
}

/**
 * Get the Tailwind color class for an achievement icon
 * @param type - The achievement type
 * @returns Tailwind color class (e.g., "text-blue-500", "text-orange-500")
 */
export function getAchievementIconColor(type: AchievementType): string {
  return achievementConfigs[type].iconColor;
}
