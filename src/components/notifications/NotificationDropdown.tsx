'use client';

import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificationStore } from '@/stores/notification-store';
import { markAllNotificationsRead, markNotificationsRead } from '@/actions/notifications';
import { NotificationItem } from './NotificationItem';
import { NotificationSkeleton } from './NotificationSkeleton';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface NotificationDropdownProps {
  loading?: boolean;
  onClose?: () => void;
}

export function NotificationDropdown({ loading, onClose }: NotificationDropdownProps) {
  const {
    recentNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    setDropdownOpen,
  } = useNotificationStore();
  const { toast } = useToast();
  const [markingAll, setMarkingAll] = useState(false);

  const handleMarkRead = async (id: string) => {
    // Optimistic update
    markAsRead([id]);
    useNotificationStore.getState().decrementUnreadCount();

    const result = await markNotificationsRead({ notification_ids: [id] });
    if (!result.success) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);

    // Optimistic update
    markAllAsRead();

    const result = await markAllNotificationsRead();
    if (!result.success) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setMarkingAll(false);
  };

  const handleViewAll = () => {
    setDropdownOpen(false);
    onClose?.();
  };

  return (
    <div className="w-80 sm:w-96">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
          Notifications
        </h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification list */}
      <ScrollArea className="max-h-[60vh]">
        {loading ? (
          <NotificationSkeleton count={4} />
        ) : recentNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Bell className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              You&apos;re all caught up!
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              No new notifications
            </p>
          </div>
        ) : (
          <div className="py-1">
            {recentNotifications.slice(0, 10).map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                compact
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="border-t px-4 py-2">
        <Link
          href="/dashboard/notifications"
          onClick={handleViewAll}
          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          View All Notifications
        </Link>
      </div>
    </div>
  );
}
