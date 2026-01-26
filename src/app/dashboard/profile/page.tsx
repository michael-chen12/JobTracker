import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ResumeUpload } from '@/components/profile/ResumeUpload';

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
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Resume</h2>
          <ResumeUpload currentResumeUrl={profile?.resume_url ?? null} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          <p className="text-sm text-gray-500">Coming soon...</p>
        </section>
      </div>
    </div>
  );
}
