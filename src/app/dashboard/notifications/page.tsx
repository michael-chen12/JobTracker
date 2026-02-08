'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { NotificationSkeleton } from '@/components/notifications/NotificationSkeleton';
import {
  getNotifications,
  markNotificationsRead,
  markAllNotificationsRead,
  deleteNotification,
} from '@/actions/notifications';
import { useNotificationStore } from '@/stores/notification-store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { NotificationRow } from '@/types/notifications';
import type { NotificationFilter } from '@/schemas/notifications';

const FILTERS: { value: NotificationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'follow_up', label: 'Follow-ups' },
  { value: 'interview', label: 'Interviews' },
  { value: 'offer', label: 'Offers' },
  { value: 'achievement', label: 'Achievements' },
  { value: 'deadline', label: 'Deadlines' },
];

const PAGE_SIZE = 20;

function groupByDate(notifications: NotificationRow[]): { label: string; items: NotificationRow[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { Today: NotificationRow[]; Yesterday: NotificationRow[]; 'This Week': NotificationRow[]; Older: NotificationRow[] } = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Older: [],
  };

  for (const n of notifications) {
    const date = new Date(n.created_at);
    if (date >= today) {
      groups.Today.push(n);
    } else if (date >= yesterday) {
      groups.Yesterday.push(n);
    } else if (date >= weekAgo) {
      groups['This Week'].push(n);
    } else {
      groups.Older.push(n);
    }
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [offset, setOffset] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const { setUnreadCount } = useNotificationStore();
  const { toast } = useToast();

  const fetchNotifications = useCallback(
    async (filterValue: NotificationFilter, offsetValue: number) => {
      setLoading(true);
      const result = await getNotifications(PAGE_SIZE, offsetValue, filterValue);
      if (result.success) {
        setNotifications(result.data.notifications);
        setTotal(result.data.total);
        setUnreadCount(result.data.unreadCount);
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
      setLoading(false);
    },
    [setUnreadCount, toast]
  );

  useEffect(() => {
    fetchNotifications(filter, offset);
  }, [filter, offset, fetchNotifications]);

  const handleFilterChange = (newFilter: NotificationFilter) => {
    setFilter(newFilter);
    setOffset(0);
  };

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    useNotificationStore.getState().decrementUnreadCount();

    const result = await markNotificationsRead({ notification_ids: [id] });
    if (!result.success) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
      fetchNotifications(filter, offset);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    const result = await markAllNotificationsRead();
    if (result.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      useNotificationStore.getState().setUnreadCount(0);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setMarkingAll(false);
  };

  const handleDelete = async (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (notification && !notification.is_read) {
      useNotificationStore.getState().decrementUnreadCount();
    }

    const result = await deleteNotification(id);
    if (!result.success) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
      fetchNotifications(filter, offset);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const grouped = groupByDate(notifications);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} total{useNotificationStore.getState().unreadCount > 0 && ` · ${useNotificationStore.getState().unreadCount} unread`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={markingAll || useNotificationStore.getState().unreadCount === 0}
        >
          {markingAll ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <CheckCheck className="h-4 w-4 mr-1" />
          )}
          Mark all read
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors',
              filter === f.value
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {loading ? (
        <div className="rounded-lg border bg-white dark:bg-gray-800 p-4">
          <NotificationSkeleton count={6} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-lg border bg-white dark:bg-gray-800 flex flex-col items-center justify-center py-16 px-4 text-center">
          <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
            No notifications
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {filter === 'all'
              ? "You're all caught up!"
              : `No ${FILTERS.find((f) => f.value === filter)?.label.toLowerCase()} notifications`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.label}>
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
                {group.label}
              </h2>
              <div className="rounded-lg border bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {group.items.map((notification) => (
                  <div key={notification.id} className="flex items-center group">
                    <div className="flex-1">
                      <NotificationItem
                        notification={notification}
                        onMarkRead={handleMarkRead}
                      />
                    </div>
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 mr-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                disabled={offset === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(offset + PAGE_SIZE)}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
