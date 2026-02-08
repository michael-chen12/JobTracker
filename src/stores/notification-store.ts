import { create } from 'zustand';
import type { NotificationRow } from '@/types/notifications';

interface NotificationState {
  unreadCount: number;
  recentNotifications: NotificationRow[];
  isDropdownOpen: boolean;

  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: (by?: number) => void;
  addNotification: (notification: NotificationRow) => void;
  setRecentNotifications: (notifications: NotificationRow[]) => void;
  setDropdownOpen: (open: boolean) => void;
  markAsRead: (ids: string[]) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

const MAX_RECENT = 20;

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  recentNotifications: [],
  isDropdownOpen: false,

  setUnreadCount: (count) => set({ unreadCount: count }),

  incrementUnreadCount: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  decrementUnreadCount: (by = 1) =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - by) })),

  addNotification: (notification) =>
    set((state) => ({
      recentNotifications: [notification, ...state.recentNotifications].slice(0, MAX_RECENT),
    })),

  setRecentNotifications: (notifications) =>
    set({ recentNotifications: notifications }),

  setDropdownOpen: (open) => set({ isDropdownOpen: open }),

  markAsRead: (ids) =>
    set((state) => ({
      recentNotifications: state.recentNotifications.map((n) =>
        ids.includes(n.id) ? { ...n, is_read: true } : n
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      unreadCount: 0,
      recentNotifications: state.recentNotifications.map((n) => ({
        ...n,
        is_read: true,
      })),
    })),

  removeNotification: (id) =>
    set((state) => ({
      recentNotifications: state.recentNotifications.filter((n) => n.id !== id),
    })),
}));
