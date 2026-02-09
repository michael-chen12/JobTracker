'use client';

import { useEffect, useState } from 'react';
import { useNotificationStore } from '@/stores/notification-store';
import { useNotificationRealtime } from '@/hooks/useNotificationRealtime';
import { getNotifications, getUnreadCount } from '@/actions/notifications';

interface NotificationProviderProps {
  userId: string | null;
  children: React.ReactNode;
}

/**
 * Wraps the dashboard layout to initialize notification state and Realtime subscription.
 * Fetches initial unread count and recent notifications on mount.
 */
export function NotificationProvider({ userId, children }: NotificationProviderProps) {
  const [initialized, setInitialized] = useState(false);

  // Initialize Realtime subscription
  useNotificationRealtime(userId);

  // Fetch initial data on mount
  useEffect(() => {
    if (!userId || initialized) return;

    async function fetchInitialData() {
      const [countResult, notificationsResult] = await Promise.all([
        getUnreadCount(),
        getNotifications(10, 0, 'all'),
      ]);

      // Get store actions inside effect to avoid dependency issues
      const { setUnreadCount, setRecentNotifications } = useNotificationStore.getState();

      if (countResult.success) {
        setUnreadCount(countResult.data.count);
      }

      if (notificationsResult.success) {
        setRecentNotifications(notificationsResult.data.notifications);
      }

      setInitialized(true);
    }

    fetchInitialData();
  }, [userId, initialized]);

  return <>{children}</>;
}
