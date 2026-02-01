import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAnalytics } from '@/actions/analytics';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch analytics data
  const result = await getAnalytics('all');

  if (result.error || !result.data) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-lg font-semibold text-destructive">
            Failed to load analytics data
          </p>
          {result.error && (
            <p className="text-sm text-muted-foreground">{result.error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <AnalyticsDashboard
      initialData={result.data}
      initialRange="all"
    />
  );
}
