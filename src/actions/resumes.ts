'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

type UploadResumeResult =
  | { success: true; data: { url: string; fileName: string } }
  | { success: false; error: string };

export async function uploadResume(formData: FormData): Promise<UploadResumeResult> {
  try {
    const supabase = await createClient();

    // Get current auth user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get application user ID from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single();

    if (userError || !user) {
      return { success: false, error: 'User profile not found' };
    }

    // Validate file
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return { success: false, error: 'File must be PDF or DOCX format' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'File size must be less than 5MB' };
    }

    // Generate unique filename (use auth ID for storage path to match RLS policy)
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    const filePath = `${authUser.id}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: 'Failed to upload file' };
    }

    // Get public URL (actually signed URL for private bucket)
    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath);

    // Update user profile with resume URL (upsert to handle new users)
    const { error: updateError } = await supabase
      .from('user_profiles')
      .upsert(
        {
          user_id: user.id,
          resume_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false
        }
      );

    if (updateError) {
      console.error('Profile update error:', updateError);
      // Attempt to delete uploaded file
      await supabase.storage.from('resumes').remove([filePath]);
      return { success: false, error: 'Failed to update profile' };
    }

    revalidatePath('/dashboard/profile');

    return {
      success: true,
      data: { url: urlData.publicUrl, fileName: file.name },
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

type DeleteResumeResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteResume(): Promise<DeleteResumeResult> {
  try {
    const supabase = await createClient();

    // Get current auth user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get application user ID from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single();

    if (userError || !user) {
      return { success: false, error: 'User profile not found' };
    }

    // Get current resume URL from profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('resume_url')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.resume_url) {
      return { success: false, error: 'No resume found' };
    }

    // Extract file path from URL
    const url = new URL(profile.resume_url);
    const pathParts = url.pathname.split('/resumes/');
    if (pathParts.length < 2 || !pathParts[1]) {
      return { success: false, error: 'Invalid resume URL' };
    }
    const filePath: string = pathParts[1];

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('resumes')
      .remove([filePath]);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return { success: false, error: 'Failed to delete file' };
    }

    // Update profile to remove resume URL
    const { error: updateError } = await supabase
      .from('user_profiles')
      .upsert(
        {
          user_id: user.id,
          resume_url: null,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false
        }
      );

    if (updateError) {
      console.error('Profile update error:', updateError);
      return { success: false, error: 'Failed to update profile' };
    }

    revalidatePath('/dashboard/profile');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
