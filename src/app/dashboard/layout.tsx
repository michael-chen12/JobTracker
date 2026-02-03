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
                  <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                    {user.email}
                  </span>
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
