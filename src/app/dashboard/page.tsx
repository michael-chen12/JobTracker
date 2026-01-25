import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getApplications } from '@/actions/applications';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch user's applications
  const { data: applications, error } = await getApplications();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome back, {user.user_metadata?.full_name || user.email}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Applications
            </h3>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {applications?.length || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Active
            </h3>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
              {applications?.filter((app) => app.status === 'applied' || app.status === 'screening' || app.status === 'interviewing').length || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Interviews
            </h3>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
              {applications?.filter((app) => app.status === 'interviewing').length || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Offers
            </h3>
            <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
              {applications?.filter((app) => app.status === 'offer').length || 0}
            </p>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Applications
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {error && (
              <div className="px-6 py-4 text-red-600 dark:text-red-400">
                Error loading applications: {error}
              </div>
            )}
            {applications && applications.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No applications yet. Start tracking your job search!
                </p>
              </div>
            )}
            {applications && applications.length > 0 && applications.slice(0, 10).map((app) => (
              <div key={app.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {app.position}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {app.company}
                    </p>
                    {app.location && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {app.location}
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      app.status === 'applied' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                      app.status === 'interviewing' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      app.status === 'offer' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                </div>
                {app.applied_date && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Applied: {new Date(app.applied_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
