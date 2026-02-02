// Achievement detection logic
// This file contains the core business logic for detecting and creating achievements

import { createAdminClient } from '@/lib/supabase/server';
import type {
  Achievement,
  AchievementType,
  AchievementMetadata,
  DetectionResult,
  CelebrationData,
} from '@/types/achievements';
import type { Application } from '@/types/application';
import { getAchievementConfig } from './config';

/**
 * Helper: Check if application has any of the specified statuses
 */
function hasStatus(application: Application, statuses: string | string[]): boolean {
  const statusArray = Array.isArray(statuses) ? statuses : [statuses];
  return statusArray.includes(application.status);
}

/**
 * Helper: Count applications with specific status(es)
 */
function countByStatus(applications: Application[], statuses: string[]): number {
  return applications.filter((app) => statuses.includes(app.status)).length;
}

/**
 * Detect new achievements for a user based on their applications
 *
 * @param userId - The database user ID (not auth ID)
 * @param applicationId - Optional application ID that triggered this detection
 * @returns Detection result with new achievements and celebration data
 */
export async function detectAchievements(
  userId: string,
  applicationId?: string
): Promise<DetectionResult> {
  const supabase = createAdminClient();
  const newAchievements: Achievement[] = [];
  const celebrationData: CelebrationData[] = [];

  try {
    // Fetch all user applications
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (appsError || !applications) {
      console.error('Error fetching applications for achievement detection:', appsError);
      return { newAchievements, celebrationData };
    }

    // Fetch existing achievements to prevent duplicates
    const { data: existingAchievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('achievement_type')
      .eq('user_id', userId);

    if (achievementsError) {
      console.error('Error fetching existing achievements:', achievementsError);
      return { newAchievements, celebrationData };
    }

    const existingTypes = new Set(
      existingAchievements?.map((a) => a.achievement_type) || []
    );

    // Helper: Check if achievement already exists
    const exists = (type: AchievementType) => existingTypes.has(type);

    // Helper: Create achievement
    const createAchievement = async (
      type: AchievementType,
      metadata: AchievementMetadata
    ): Promise<Achievement | null> => {
      const { data, error } = await supabase
        .from('achievements')
        .insert({
          user_id: userId,
          achievement_type: type,
          metadata,
        })
        .select()
        .single();

      if (error) {
        console.error(`Error creating achievement ${type}:`, error);
        return null;
      }

      return data;
    };

    // Get the triggering application for context
    let triggeringApp: Application | undefined;
    if (applicationId) {
      triggeringApp = applications.find((app) => app.id === applicationId);
    }

    // ========================================================================
    // DETECTION RULE 1: First Application
    // ========================================================================
    if (!exists('first_application') && applications.length === 1) {
      const app = applications[0];
      const achievement = await createAchievement('first_application', {
        application_id: app.id,
        company: app.company,
        position: app.position,
      });

      if (achievement) {
        newAchievements.push(achievement);
        const config = getAchievementConfig('first_application');
        celebrationData.push({
          id: achievement.id,
          achievement_type: 'first_application',
          title: config.title,
          message: config.getMessage(achievement.metadata),
          icon: config.icon,
          color: config.color,
        });
      }
    }

    // ========================================================================
    // DETECTION RULE 2: 10 Applications Milestone
    // ========================================================================
    if (!exists('milestone_10_apps') && applications.length >= 10) {
      const achievement = await createAchievement('milestone_10_apps', {
        count: applications.length,
      });

      if (achievement) {
        newAchievements.push(achievement);
        const config = getAchievementConfig('milestone_10_apps');
        celebrationData.push({
          id: achievement.id,
          achievement_type: 'milestone_10_apps',
          title: config.title,
          message: config.getMessage(achievement.metadata),
          icon: config.icon,
          color: config.color,
        });
      }
    }

    // ========================================================================
    // DETECTION RULE 3: 25 Applications Milestone
    // ========================================================================
    if (!exists('milestone_25_apps') && applications.length >= 25) {
      const achievement = await createAchievement('milestone_25_apps', {
        count: applications.length,
      });

      if (achievement) {
        newAchievements.push(achievement);
        const config = getAchievementConfig('milestone_25_apps');
        celebrationData.push({
          id: achievement.id,
          achievement_type: 'milestone_25_apps',
          title: config.title,
          message: config.getMessage(achievement.metadata),
          icon: config.icon,
          color: config.color,
        });
      }
    }

    // ========================================================================
    // DETECTION RULE 4: 50 Applications Milestone
    // ========================================================================
    if (!exists('milestone_50_apps') && applications.length >= 50) {
      const achievement = await createAchievement('milestone_50_apps', {
        count: applications.length,
      });

      if (achievement) {
        newAchievements.push(achievement);
        const config = getAchievementConfig('milestone_50_apps');
        celebrationData.push({
          id: achievement.id,
          achievement_type: 'milestone_50_apps',
          title: config.title,
          message: config.getMessage(achievement.metadata),
          icon: config.icon,
          color: config.color,
        });
      }
    }

    // ========================================================================
    // DETECTION RULE 5: First Response (screening or beyond)
    // ========================================================================
    if (!exists('first_response')) {
      const responseStatuses = ['screening', 'interviewing', 'offer', 'accepted'];
      const responseApps = applications.filter((app) =>
        responseStatuses.includes(app.status)
      );

      if (responseApps.length > 0) {
        const firstResponseApp = responseApps[0]; // Already sorted by created_at
        const achievement = await createAchievement('first_response', {
          application_id: firstResponseApp.id,
          company: firstResponseApp.company,
          position: firstResponseApp.position,
        });

        if (achievement) {
          newAchievements.push(achievement);
          const config = getAchievementConfig('first_response');
          celebrationData.push({
            id: achievement.id,
            achievement_type: 'first_response',
            title: config.title,
            message: config.getMessage(achievement.metadata),
            icon: config.icon,
            color: config.color,
          });
        }
      }
    }

    // ========================================================================
    // DETECTION RULE 6: First Interview
    // ========================================================================
    if (!exists('first_interview_any')) {
      const interviewApps = applications.filter((app) => app.status === 'interviewing');

      if (interviewApps.length > 0) {
        const firstInterviewApp = interviewApps[0];
        const achievement = await createAchievement('first_interview_any', {
          application_id: firstInterviewApp.id,
          company: firstInterviewApp.company,
          position: firstInterviewApp.position,
        });

        if (achievement) {
          newAchievements.push(achievement);
          const config = getAchievementConfig('first_interview_any');
          celebrationData.push({
            id: achievement.id,
            achievement_type: 'first_interview_any',
            title: config.title,
            message: config.getMessage(achievement.metadata),
            icon: config.icon,
            color: config.color,
          });
        }
      }
    }

    // ========================================================================
    // DETECTION RULE 7: First Offer
    // ========================================================================
    if (!exists('first_offer')) {
      const offerApps = applications.filter((app) => app.status === 'offer');

      if (offerApps.length > 0) {
        const firstOfferApp = offerApps[0];
        const achievement = await createAchievement('first_offer', {
          application_id: firstOfferApp.id,
          company: firstOfferApp.company,
          position: firstOfferApp.position,
        });

        if (achievement) {
          newAchievements.push(achievement);
          const config = getAchievementConfig('first_offer');
          celebrationData.push({
            id: achievement.id,
            achievement_type: 'first_offer',
            title: config.title,
            message: config.getMessage(achievement.metadata),
            icon: config.icon,
            color: config.color,
          });
        }
      }
    }

    // ========================================================================
    // DETECTION RULE 8: First Acceptance
    // ========================================================================
    if (!exists('first_acceptance')) {
      const acceptedApps = applications.filter((app) => app.status === 'accepted');

      if (acceptedApps.length > 0) {
        const firstAcceptedApp = acceptedApps[0];
        const achievement = await createAchievement('first_acceptance', {
          application_id: firstAcceptedApp.id,
          company: firstAcceptedApp.company,
          position: firstAcceptedApp.position,
        });

        if (achievement) {
          newAchievements.push(achievement);
          const config = getAchievementConfig('first_acceptance');
          celebrationData.push({
            id: achievement.id,
            achievement_type: 'first_acceptance',
            title: config.title,
            message: config.getMessage(achievement.metadata),
            icon: config.icon,
            color: config.color,
          });
        }
      }
    }

    // ========================================================================
    // DETECTION RULE 9 & 10: Week Streaks (3 and 5 weeks)
    // NOTE: Deferred to Phase 2 - requires complex date logic
    // For MVP, we'll skip streak detection and implement in future enhancement
    // ========================================================================

    return { newAchievements, celebrationData };
  } catch (error) {
    console.error('Error in detectAchievements:', error);
    return { newAchievements, celebrationData };
  }
}
