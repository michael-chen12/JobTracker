import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAchievements } from '@/actions/achievements';
import { WinsDashboard } from '@/components/achievements/WinsDashboard';

/**
 * Wins Page - Full page view of all user achievements
 *
 * Server component that:
 * - Checks authentication (redirects to login if not authenticated)
 * - Fetches all achievements (up to 50)
 * - Renders WinsDashboard component
 */
export default async function WinsPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // Fetch achievements
  const result = await getAchievements(50); // Fetch up to 50 achievements

  // Handle error state
  if (result.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-2">
            Failed to load achievements
          </h2>
          <p className="text-muted-foreground mb-4">{result.error}</p>
          <p className="text-sm text-muted-foreground">
            Please try refreshing the page or contact support if the problem
            persists.
          </p>
        </div>
      </div>
    );
  }

  const achievements = 'data' in result ? result.data : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <WinsDashboard achievements={achievements} />
    </div>
  );
}
