import type { Metadata } from "next";
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "Profile & Settings",
  description: "Manage your profile, resume, and account preferences.",
};
import { ResumeUpload } from '@/components/profile/ResumeUpload';
import { ParsedResumeDisplay } from '@/components/profile/ParsedResumeDisplay';
import { DataPrivacySection } from '@/components/profile/DataPrivacySection';
import { NotificationPreferencesSection } from '@/components/notifications/NotificationPreferencesSection';
import { FormSection } from '@/components/applications/FormSection';
import { User, AlertCircle } from 'lucide-react';
import { RetryParsingButton } from '@/components/profile/RetryParsingButton';
import type { AccountDeletionRequest } from '@/types/application';

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // Get database user ID from auth ID
  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  if (!dbUser) {
    redirect('/auth/login');
  }

  // Get user profile with parsed resume data
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('resume_url, parsed_resume_data, resume_parsed_at, resume_parsing_error')
    .eq('user_id', dbUser.id)
    .single();

  // If resume_url exists (it's a file path), generate a signed URL
  let resumeSignedUrl: string | null = null;
  if (profile?.resume_url) {
    const { data: signedUrlData } = await supabase.storage
      .from('resumes')
      .createSignedUrl(profile.resume_url, 3600); // 1 hour expiry
    
    resumeSignedUrl = signedUrlData?.signedUrl || null;
  }

  // Check for pending account deletion request
  let deletionRequest: AccountDeletionRequest | null = null;
  const { data: deletionData } = await supabase
    .from('account_deletion_requests')
    .select('*')
    .eq('user_id', dbUser.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (deletionData) {
    deletionRequest = deletionData as AccountDeletionRequest;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto max-w-7xl py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage your account information and preferences
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-4 sm:space-y-6">
          {/* Account Information Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <FormSection
              label="Account Information"
              description="Your account email and authentication details"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
                <div className="flex-shrink-0 self-start sm:self-auto">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Verified
                  </span>
                </div>
              </div>
            </FormSection>
          </div>

          {/* Resume Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <FormSection
              label="Resume"
              description="Upload your resume for AI-powered job matching and analysis"
            >
              <ResumeUpload 
                currentResumeUrl={resumeSignedUrl} 
                isParsed={!!profile?.parsed_resume_data}
              />
            </FormSection>
          </div>

          {/* Parsed Resume Data */}
          {profile?.parsed_resume_data && profile.resume_parsed_at && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <FormSection
                label="Parsed Resume Data"
                description="AI-extracted information from your resume"
              >
                <div className="space-y-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Last parsed: {new Date(profile.resume_parsed_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <ParsedResumeDisplay parsedData={profile.parsed_resume_data} />
                </div>
              </FormSection>
            </div>
          )}

          {/* Parsing Error */}
          {profile?.resume_parsing_error && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                    Resume Parsing Failed
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                    {profile.resume_parsing_error}
                  </p>
                  <RetryParsingButton />
                </div>
              </div>
            </div>
          )}

          {/* Notification Preferences */}
          <NotificationPreferencesSection />

          {/* Data & Privacy Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <DataPrivacySection
              userEmail={user.email!}
              initialDeletionRequest={deletionRequest}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
