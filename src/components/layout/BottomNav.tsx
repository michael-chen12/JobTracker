'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Plus,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApplicationDialogStore } from '@/stores/application-dialog-store';

interface NavItem {
  href?: string;
  label: string;
  icon: React.ElementType;
  action?: 'add';
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { label: 'Add', icon: Plus, action: 'add' },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const setDialogOpen = useApplicationDialogStore((s) => s.setOpen);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border/60 lg:hidden overflow-hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      data-testid="bottom-nav"
    >
      <div className="flex items-end justify-between px-2 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;

          // Center "Add" button — special styling
          if (item.action === 'add') {
            return (
              <button
                key="add"
                onClick={() => setDialogOpen(true)}
                className="flex flex-col items-center justify-center -mt-4 min-w-[48px] min-h-[48px] flex-1"
                aria-label="Add new application"
                data-testid="bottom-nav-add"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-warm hover:opacity-90 transition-opacity flex-shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] mt-0.5 text-muted-foreground truncate max-w-[56px] text-center">
                  {item.label}
                </span>
              </button>
            );
          }

          const active = isActive(item.href!);

          return (
            <Link
              key={item.href}
              href={item.href!}
              prefetch={true}
              onFocus={() => router.prefetch(item.href!)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] py-1 transition-colors flex-1',
                active
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={active ? 'page' : undefined}
              data-testid={`bottom-nav-${item.label.toLowerCase()}`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-[10px] font-medium truncate max-w-[56px] text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
