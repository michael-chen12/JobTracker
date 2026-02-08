'use client';

import { useRouter } from 'next/navigation';
import {
  Clock,
  Briefcase,
  Gift,
  Trophy,
  BarChart3,
  Bell,
  CalendarClock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NotificationRow, ExtendedNotificationType } from '@/types/notifications';

const ICON_MAP: Record<ExtendedNotificationType, React.ElementType> = {
  follow_up: Clock,
  deadline: CalendarClock,
  interview: Briefcase,
  offer: Gift,
  achievement: Trophy,
  weekly_digest: BarChart3,
  general: Bell,
};

const ICON_COLOR_MAP: Record<ExtendedNotificationType, string> = {
  follow_up: 'text-amber-500',
  deadline: 'text-red-500',
  interview: 'text-blue-500',
  offer: 'text-green-500',
  achievement: 'text-purple-500',
  weekly_digest: 'text-indigo-500',
  general: 'text-gray-500',
};

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface NotificationItemProps {
  notification: NotificationRow;
  onMarkRead?: (id: string) => void;
  compact?: boolean;
}

export function NotificationItem({
  notification,
  onMarkRead,
  compact = false,
}: NotificationItemProps) {
  const router = useRouter();
  const Icon = ICON_MAP[notification.notification_type] || Bell;
  const iconColor = ICON_COLOR_MAP[notification.notification_type] || 'text-gray-500';

  const handleClick = () => {
    if (!notification.is_read && onMarkRead) {
      onMarkRead(notification.id);
    }
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-md',
        !notification.is_read && 'bg-blue-50/50 dark:bg-blue-950/20',
        compact && 'p-2'
      )}
    >
      {/* Unread indicator + icon */}
      <div className="relative flex-shrink-0 mt-0.5">
        <Icon className={cn('h-5 w-5', iconColor)} />
        {!notification.is_read && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-500" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm leading-tight',
            notification.is_read
              ? 'text-gray-600 dark:text-gray-400'
              : 'text-gray-900 dark:text-white font-medium'
          )}
        >
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {getRelativeTime(notification.created_at)}
        </p>
      </div>
    </button>
  );
}
