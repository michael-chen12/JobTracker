import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/auth/SignOutButton";

export default async function NotFound() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = Boolean(user);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold text-gray-900 dark:text-white"
          >
            Job Tracker
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link
              href="/"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Home
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard/profile"
                  className="hidden md:inline text-gray-500 dark:text-gray-400"
                >
                  {user?.email}
                </Link>
                <SignOutButton />
              </>
            ) : (
              <Link
                href="/auth/login"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <section>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                Error 404
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold mt-4 text-gray-900 dark:text-white">
                We couldn&apos;t find that page.
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-4 max-w-xl">
                The link may be outdated, or the page might have moved. Try one
                of the destinations below or return to a safe place.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  Back to Home
                </Link>
                <Link
                  href="/dashboard"
                  className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors text-center"
                >
                  Go to Dashboard
                </Link>
              </div>
              <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
                Tip: check the URL for typos or missing characters.
              </div>
            </section>

            <aside className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                Popular destinations
              </h2>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link
                    href="/dashboard"
                    className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
                  >
                    Dashboard overview
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
                  >
                    Applications
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/profile"
                    className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
                  >
                    Profile settings
                  </Link>
                </li>
              </ul>
              {!isAuthenticated && (
                <div className="mt-6 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Need access?{" "}
                    <Link
                      href="/auth/login"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © Job Tracker. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link
              href="/"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Home
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Profile
                </Link>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
