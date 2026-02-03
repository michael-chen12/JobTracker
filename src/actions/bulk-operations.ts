'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { applicationStatusSchema } from '@/schemas/application';

// Validation schemas
const bulkUpdateStatusSchema = z.object({
  applicationIds: z
    .array(z.string().uuid())
    .min(1, 'At least one application must be selected')
    .max(50, 'Cannot update more than 50 applications at once'),
  status: applicationStatusSchema,
});

const bulkDeleteSchema = z.object({
  applicationIds: z
    .array(z.string().uuid())
    .min(1, 'At least one application must be selected')
    .max(50, 'Cannot delete more than 50 applications at once'),
});

// Result type for bulk operations
export type BulkOperationResult = {
  success: boolean;
  successCount: number;
  failureCount: number;
  failedIds?: string[];
  error?: string;
};

/**
 * Bulk update status for multiple applications
 * @param applicationIds - Array of application IDs (max 50)
 * @param status - New status to apply
 * @returns Operation result with success/failure counts
 */
export async function bulkUpdateStatus(
  applicationIds: string[],
  status: string
): Promise<BulkOperationResult> {
  try {
    // Validate input
    const validatedData = bulkUpdateStatusSchema.parse({
      applicationIds,
      status,
    });

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        successCount: 0,
        failureCount: applicationIds.length,
        error: 'Not authenticated',
      };
    }

    // Get database user
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', user.id)
      .single();

    if (!dbUser) {
      return {
        success: false,
        successCount: 0,
        failureCount: applicationIds.length,
        error: 'User not found',
      };
    }

    // Fetch applications to verify ownership (IDOR protection)
    const { data: applications, error: fetchError } = await supabase
      .from('applications')
      .select('id, user_id')
      .in('id', validatedData.applicationIds);

    if (fetchError) {
      console.error('Error fetching applications for bulk update:', fetchError);
      return {
        success: false,
        successCount: 0,
        failureCount: applicationIds.length,
        error: 'Failed to fetch applications',
      };
    }

    // Filter to only owned applications
    const ownedApplicationIds = applications
      ?.filter((app) => app.user_id === dbUser.id)
      .map((app) => app.id) || [];

    if (ownedApplicationIds.length === 0) {
      return {
        success: false,
        successCount: 0,
        failureCount: applicationIds.length,
        error: 'No applications found or not authorized',
      };
    }

    // Batch update status
    const { error: updateError } = await supabase
      .from('applications')
      .update({
        status: validatedData.status,
        updated_at: new Date().toISOString(),
      })
      .in('id', ownedApplicationIds)
      .eq('user_id', dbUser.id); // Additional safety check

    if (updateError) {
      console.error('Error updating applications:', updateError);
      return {
        success: false,
        successCount: 0,
        failureCount: applicationIds.length,
        error: 'Failed to update applications',
      };
    }

    // Calculate success/failure counts
    const successCount = ownedApplicationIds.length;
    const failureCount = applicationIds.length - successCount;
    const failedIds = applicationIds.filter(
      (id) => !ownedApplicationIds.includes(id)
    );

    // Revalidate relevant paths and tags
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/applications');
    revalidateTag('applications', 'max');

    return {
      success: true,
      successCount,
      failureCount,
      ...(failureCount > 0 && { failedIds }),
    };
  } catch (error) {
    console.error('Bulk update status error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        successCount: 0,
        failureCount: applicationIds.length,
        error: error.errors[0]?.message || 'Validation error',
      };
    }

    return {
      success: false,
      successCount: 0,
      failureCount: applicationIds.length,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Bulk delete multiple applications
 * @param applicationIds - Array of application IDs (max 50)
 * @returns Operation result with success/failure counts
 */
export async function bulkDeleteApplications(
  applicationIds: string[]
): Promise<BulkOperationResult> {
  try {
    // Validate input
    const validatedData = bulkDeleteSchema.parse({ applicationIds });

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        successCount: 0,
        failureCount: applicationIds.length,
        error: 'Not authenticated',
      };
    }

    // Get database user
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', user.id)
      .single();

    if (!dbUser) {
      return {
        success: false,
        successCount: 0,
        failureCount: applicationIds.length,
        error: 'User not found',
      };
    }

    // Fetch applications to verify ownership (IDOR protection)
    const { data: applications, error: fetchError } = await supabase
      .from('applications')
      .select('id, user_id')
      .in('id', validatedData.applicationIds);

    if (fetchError) {
      console.error('Error fetching applications for bulk delete:', fetchError);
      return {
        success: false,
        successCount: 0,
        failureCount: applicationIds.length,
        error: 'Failed to fetch applications',
      };
    }

    // Filter to only owned applications
    const ownedApplicationIds = applications
      ?.filter((app) => app.user_id === dbUser.id)
      .map((app) => app.id) || [];

    if (ownedApplicationIds.length === 0) {
      return {
        success: false,
        successCount: 0,
        failureCount: applicationIds.length,
        error: 'No applications found or not authorized',
      };
    }

    // Batch delete applications (CASCADE handles related data)
    const { error: deleteError } = await supabase
      .from('applications')
      .delete()
      .in('id', ownedApplicationIds)
      .eq('user_id', dbUser.id); // Additional safety check

    if (deleteError) {
      console.error('Error deleting applications:', deleteError);
      return {
        success: false,
        successCount: 0,
        failureCount: applicationIds.length,
        error: 'Failed to delete applications',
      };
    }

    // Calculate success/failure counts
    const successCount = ownedApplicationIds.length;
    const failureCount = applicationIds.length - successCount;
    const failedIds = applicationIds.filter(
      (id) => !ownedApplicationIds.includes(id)
    );

    // Revalidate relevant paths and tags
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/applications');
    revalidateTag('applications', 'max');
    revalidateTag('contacts', 'max'); // In case referrals were affected

    return {
      success: true,
      successCount,
      failureCount,
      ...(failureCount > 0 && { failedIds }),
    };
  } catch (error) {
    console.error('Bulk delete error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        successCount: 0,
        failureCount: applicationIds.length,
        error: error.errors[0]?.message || 'Validation error',
      };
    }

    return {
      success: false,
      successCount: 0,
      failureCount: applicationIds.length,
      error: 'An unexpected error occurred',
    };
  }
}
