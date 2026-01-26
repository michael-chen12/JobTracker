import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ResumeUpload } from '@/components/profile/ResumeUpload';
import { FormSection } from '@/components/applications/FormSection';
import { User, FileText, Settings } from 'lucide-react';

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('resume_url')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container max-w-5xl py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account information and preferences
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Account Information Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <FormSection
              label="Account Information"
              description="Your account email and authentication details"
            >
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Verified
                  </span>
                </div>
              </div>
            </FormSection>
          </div>

          {/* Resume Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <FormSection
              label="Resume"
              description="Upload your resume for AI-powered job matching and analysis"
            >
              <ResumeUpload currentResumeUrl={profile?.resume_url ?? null} />
            </FormSection>
          </div>

          {/* Coming Soon Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <FormSection
              label="Personal Information"
              description="Additional profile details and preferences"
            >
              <div className="flex items-center justify-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <div className="text-center">
                  <Settings className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" />
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Coming Soon
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Additional profile settings will be available here
                  </p>
                </div>
              </div>
            </FormSection>
          </div>
        </div>
      </div>
    </div>
  );
}
