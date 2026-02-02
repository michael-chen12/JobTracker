'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/wins', label: 'Wins' },
  { href: '/dashboard/contacts', label: 'Contacts' },
  { href: '/dashboard/profile', label: 'Profile' },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams?.toString();
  const [progress, setProgress] = useState(0);
  const progressResetTimeout = useRef<number | null>(null);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    navItems.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  const startNavigation = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    if (progressResetTimeout.current) {
      window.clearTimeout(progressResetTimeout.current);
      progressResetTimeout.current = null;
    }
    setProgress(30);
  }, []);

  useEffect(() => {
    if (!isNavigatingRef.current) return;
    setProgress(100);
    isNavigatingRef.current = false;
    progressResetTimeout.current = window.setTimeout(() => {
      setProgress(0);
      progressResetTimeout.current = null;
    }, 200);
  }, [pathname, search]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      const anchor = event.target.closest('a');
      if (!anchor) return;
      if (anchor.getAttribute('target') === '_blank' || anchor.hasAttribute('download')) {
        return;
      }

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return;

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.href === window.location.href) return;

      startNavigation();
    };

    const handlePopState = () => {
      startNavigation();
    };

    document.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [startNavigation]);
  useEffect(() => {
    return () => {
      if (progressResetTimeout.current) {
        window.clearTimeout(progressResetTimeout.current);
      }
    };
  }, []);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="ml-10 hidden md:block">
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
