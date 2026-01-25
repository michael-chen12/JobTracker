'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ApplicationFormDialog } from '@/components/applications/ApplicationFormDialog';
import { NotesSection } from '@/components/notes/NotesSection';
import { Plus } from 'lucide-react';
import type { NoteType } from '@/lib/utils/noteHelpers';

interface Note {
  id: string;
  application_id: string;
  content: string;
  note_type: NoteType;
  created_at: string;
  updated_at: string;
}

interface Application {
  id: string;
  company: string;
  position: string;
  status: string;
  location: string | null;
  applied_date: string | null;
  notes?: Note[];
}

interface DashboardClientProps {
  userName: string;
  applications: Application[];
  error: string | null;
}

export function DashboardClient({ userName, applications, error }: DashboardClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    // Refresh the page to show the new application
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with CTA */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Welcome back, {userName}
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            New Application
          </Button>
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
              {applications?.filter(
                (app) =>
                  app.status === 'applied' ||
                  app.status === 'screening' ||
                  app.status === 'interviewing'
              ).length || 0}
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
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
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
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No applications yet. Start tracking your job search!
                </p>
                <Button onClick={() => setDialogOpen(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Application
                </Button>
              </div>
            )}
            {applications &&
              applications.length > 0 &&
              applications.slice(0, 10).map((app) => (
                <div
                  key={app.id}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
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
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          app.status === 'applied'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : app.status === 'interviewing'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : app.status === 'offer'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                : app.status === 'rejected'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                  </div>
                  {app.applied_date && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Applied: {new Date(app.applied_date).toLocaleDateString()}
                    </p>
                  )}

                  {/* Notes Section */}
                  <NotesSection
                    applicationId={app.id}
                    initialNotes={app.notes || []}
                    compact={true}
                  />
                </div>
              ))}
          </div>
        </div>

        {/* Application Form Dialog */}
        <ApplicationFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}
