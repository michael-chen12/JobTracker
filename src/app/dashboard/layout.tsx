import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/auth/SignOutButton';
import Link from 'next/link';
import DashboardNav from '@/components/layout/DashboardNav';
import BottomNav from '@/components/layout/BottomNav';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get the app DB user ID for Realtime subscription.
  // SELECT first (fast path — record already exists after callback/confirm).
  // Only fall back to upsert if the row is genuinely missing (e.g. the
  // callback route failed to create it).
  let dbUserId: string | null = null;
  if (user) {
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle();

    dbUserId = dbUser?.id ?? null;

    if (!dbUserId) {
      const email = user.email ?? user.user_metadata?.email;
      if (email) {
        const { data: createdUser } = await supabase
          .from('users')
          .upsert(
            {
              auth_id: user.id,
              email,
              display_name:
                user.user_metadata?.display_name ||
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                email.split('@')[0],
              photo_url:
                user.user_metadata?.avatar_url ||
                user.user_metadata?.picture ||
                null,
              role: 'user',
            },
            { onConflict: 'auth_id' }
          )
          .select('id')
          .maybeSingle();

        dbUserId = createdUser?.id ?? null;
      }
    }
  }

  const getInitials = (email?: string | null) => {
    if (!email) return 'U';
    const name = email.split('@')[0] ?? email;
    const parts = name.split(/[^a-zA-Z0-9]+/).filter(Boolean);
    const firstInitial = parts[0]?.[0] ?? name[0] ?? 'U';
    const secondInitial = parts[1]?.[0] ?? name[1] ?? '';
    const initials =
      parts.length >= 2 ? `${firstInitial}${secondInitial}` : name.slice(0, 2);
    return initials.toUpperCase();
  };

  return (
    <div className="min-h-full bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-base font-semibold tracking-[-0.02em] text-foreground">
                Job Tracker
              </Link>

              {/* Desktop Nav */}
              <DashboardNav />
            </div>

            {/* Right side: bell + avatar */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Notification bell — visible on all screen sizes */}
              <NotificationBell />

              {/* Desktop: avatar + sign out. Mobile: accessible via Profile in bottom nav */}
              <div className="hidden lg:flex items-center gap-3">
                {user && (
                  <>
                    <Link
                      href="/dashboard/profile"
                      title={user.email ?? undefined}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border transition hover:bg-accent hover:text-foreground"
                      aria-label="Open profile"
                    >
                      <span className="text-xs font-semibold tracking-wide">
                        {getInitials(user.email)}
                      </span>
                    </Link>
                    <SignOutButton />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content — pb-16 on mobile for bottom nav clearance */}
      <NotificationProvider userId={dbUserId}>
        <main className="flex-1 min-h-0 pb-16 lg:pb-0">{children}</main>
      </NotificationProvider>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
