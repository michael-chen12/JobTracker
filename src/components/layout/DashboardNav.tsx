'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/contacts', label: 'Contacts' },
  { href: '/dashboard/profile', label: 'Profile' },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    navItems.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    if (!isNavigating) return;
    setProgress(40);
  }, [isNavigating]);

  useEffect(() => {
    if (isNavigating || progress === 0 || progress === 100) return;
    setProgress(100);
    const timeout = setTimeout(() => setProgress(0), 100);
    return () => clearTimeout(timeout);
  }, [isNavigating, progress]);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="ml-10">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className={cn(
          'fixed left-0 top-0 z-50 h-0.5 bg-gradient-to-r from-blue-500 via-sky-400 to-blue-500 transition-[width,opacity] ease-out pointer-events-none',
          progress === 100 ? 'duration-150' : 'duration-500',
          progress === 0 ? 'opacity-0' : 'opacity-100'
        )}
        style={{ width: `${progress}%` }}
      />
      <nav className="flex gap-6">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              onClick={(event) => {
                if (
                  active ||
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                ) {
                  return;
                }
                setIsNavigating(true);
              }}
              className={cn(
                'text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors',
                active &&
                  'text-gray-900 dark:text-white underline underline-offset-8 decoration-2 decoration-gray-900/70 dark:decoration-white/70'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
