import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/auth/SignOutButton';
import Link from 'next/link';
import DashboardNav from '@/components/layout/DashboardNav';
import MobileNav from '@/components/layout/MobileNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {/* Mobile Menu */}
              <MobileNav />

              <Link href="/dashboard" className="text-xl font-bold text-gray-900 dark:text-white">
                Job Tracker
              </Link>

              {/* Desktop Nav */}
              <DashboardNav />
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              {user && (
                <>
                  <Link
                    href="/dashboard/profile"
                    title={user.email ?? undefined}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 ring-1 ring-blue-200 transition hover:bg-blue-200 hover:text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 dark:ring-blue-800"
                    aria-label="Open profile"
                  >
                    <span className="text-xs font-semibold">
                      {getInitials(user.email)}
                    </span>
                  </Link>
                  <SignOutButton />
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 min-h-0">{children}</main>
    </div>
  );
}
