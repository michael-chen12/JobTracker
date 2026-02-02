// Achievement types for wins celebration system
// This file contains all TypeScript types for the achievements feature

/**
 * Achievement type enum - represents different milestone types
 */
export type AchievementType =
  // Application milestones
  | 'first_application' // User's very first job application
  | 'milestone_10_apps' // Reached 10 applications
  | 'milestone_25_apps' // Reached 25 applications
  | 'milestone_50_apps' // Reached 50 applications
  // Status progression milestones
  | 'first_response' // First company response (screening or beyond)
  | 'first_interview_any' // First interview scheduled (status = interviewing)
  | 'first_offer' // First job offer received (status = offer)
  | 'first_acceptance' // First offer accepted (status = accepted)
  // Streak milestones
  | 'week_streak_3' // 3 consecutive weeks with applications
  | 'week_streak_5'; // 5 consecutive weeks with applications

/**
 * Achievement metadata - flexible JSONB structure
 */
export interface AchievementMetadata {
  // Application reference
  application_id?: string;
  company?: string;
  position?: string;

  // Count-based achievements
  count?: number; // For milestone achievements (10, 25, 50)

  // Streak-based achievements
  streak_days?: number; // Number of days in the streak
  streak_weeks?: number; // Number of weeks in the streak

  // Additional context
  [key: string]: unknown; // Allow additional fields
}

/**
 * Achievement database row (matches database schema)
 */
export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: AchievementType;
  achieved_at: string; // ISO 8601 timestamp
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  metadata: AchievementMetadata;
  celebrated: boolean;
}

/**
 * Achievement with typed metadata (for use in UI)
 */
export interface AchievementWithMetadata extends Achievement {
  metadata: AchievementMetadata;
}

/**
 * Celebration data - returned from server actions to trigger UI celebration
 */
export interface CelebrationData {
  id: string;
  achievement_type: AchievementType;
  title: string; // e.g., "First Application!"
  message: string; // e.g., "Great job! You created your first application at Acme Corp."
  icon: string; // Emoji icon (e.g., "🎉")
  color: string; // Tailwind color class (e.g., "blue")
}

/**
 * Detection result - returned from detectAchievements function
 */
export interface DetectionResult {
  newAchievements: Achievement[];
  celebrationData: CelebrationData[];
}

/**
 * Insert type for creating new achievements
 */
export interface AchievementInsert {
  user_id: string;
  achievement_type: AchievementType;
  metadata?: AchievementMetadata;
  achieved_at?: string; // ISO 8601 timestamp, defaults to NOW()
  celebrated?: boolean; // Defaults to false
}

/**
 * Update type for partial achievement updates
 */
export interface AchievementUpdate {
  celebrated?: boolean;
  metadata?: AchievementMetadata;
}
