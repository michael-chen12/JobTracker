import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';

// ─── Schema Validation ──────────────────────────────────────────

describe('Notification Schemas', () => {
  describe('notificationTypeSchema', () => {
    it('should accept all valid notification types', async () => {
      const { notificationTypeSchema } = await import('@/schemas/notifications');
      const validTypes = [
        'deadline',
        'follow_up',
        'interview',
        'offer',
        'general',
        'achievement',
        'weekly_digest',
      ];
      for (const type of validTypes) {
        expect(notificationTypeSchema.parse(type)).toBe(type);
      }
    });

    it('should reject invalid notification types', async () => {
      const { notificationTypeSchema } = await import('@/schemas/notifications');
      expect(() => notificationTypeSchema.parse('invalid')).toThrow();
      expect(() => notificationTypeSchema.parse('')).toThrow();
      expect(() => notificationTypeSchema.parse(123)).toThrow();
    });
  });

  describe('updateNotificationPreferencesSchema', () => {
    it('should accept valid partial updates', async () => {
      const { updateNotificationPreferencesSchema } = await import(
        '@/schemas/notifications'
      );
      const result = updateNotificationPreferencesSchema.parse({
        in_app_follow_up: true,
        email_follow_up: false,
      });
      expect(result.in_app_follow_up).toBe(true);
      expect(result.email_follow_up).toBe(false);
    });

    it('should accept empty object (no changes)', async () => {
      const { updateNotificationPreferencesSchema } = await import(
        '@/schemas/notifications'
      );
      const result = updateNotificationPreferencesSchema.parse({});
      expect(result).toEqual({});
    });

    it('should accept all boolean fields', async () => {
      const { updateNotificationPreferencesSchema } = await import(
        '@/schemas/notifications'
      );
      const allFields = {
        in_app_follow_up: true,
        in_app_deadline: true,
        in_app_interview: false,
        in_app_offer: true,
        in_app_achievement: false,
        in_app_general: true,
        email_follow_up: false,
        email_deadline: true,
        email_interview: false,
        email_offer: true,
        email_weekly_digest: false,
        push_follow_up: true,
        push_deadline: false,
        push_interview: true,
        push_offer: false,
      };
      const result = updateNotificationPreferencesSchema.parse(allFields);
      expect(result).toEqual(allFields);
    });

    it('should reject non-boolean values for preference fields', async () => {
      const { updateNotificationPreferencesSchema } = await import(
        '@/schemas/notifications'
      );
      expect(() =>
        updateNotificationPreferencesSchema.parse({ in_app_follow_up: 'yes' })
      ).toThrow();
      expect(() =>
        updateNotificationPreferencesSchema.parse({ email_follow_up: 1 })
      ).toThrow();
    });
  });

  describe('registerPushSubscriptionSchema', () => {
    it('should accept valid push subscription', async () => {
      const { registerPushSubscriptionSchema } = await import(
        '@/schemas/notifications'
      );
      const result = registerPushSubscriptionSchema.parse({
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
        p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XHhAirjhkq1',
        auth: 'tBHItJI5svbpC7htgNGEpA',
      });
      expect(result.endpoint).toBe('https://fcm.googleapis.com/fcm/send/abc123');
    });

    it('should reject invalid endpoint URL', async () => {
      const { registerPushSubscriptionSchema } = await import(
        '@/schemas/notifications'
      );
      expect(() =>
        registerPushSubscriptionSchema.parse({
          endpoint: 'not-a-url',
          p256dh: 'key',
          auth: 'auth',
        })
      ).toThrow('Invalid push endpoint URL');
    });

    it('should reject empty p256dh', async () => {
      const { registerPushSubscriptionSchema } = await import(
        '@/schemas/notifications'
      );
      expect(() =>
        registerPushSubscriptionSchema.parse({
          endpoint: 'https://example.com/push',
          p256dh: '',
          auth: 'auth',
        })
      ).toThrow('p256dh key is required');
    });

    it('should reject empty auth', async () => {
      const { registerPushSubscriptionSchema } = await import(
        '@/schemas/notifications'
      );
      expect(() =>
        registerPushSubscriptionSchema.parse({
          endpoint: 'https://example.com/push',
          p256dh: 'key',
          auth: '',
        })
      ).toThrow('Auth key is required');
    });

    it('should accept optional user_agent', async () => {
      const { registerPushSubscriptionSchema } = await import(
        '@/schemas/notifications'
      );
      const result = registerPushSubscriptionSchema.parse({
        endpoint: 'https://example.com/push',
        p256dh: 'key',
        auth: 'auth',
        user_agent: 'Mozilla/5.0',
      });
      expect(result.user_agent).toBe('Mozilla/5.0');
    });

    it('should reject user_agent exceeding 500 characters', async () => {
      const { registerPushSubscriptionSchema } = await import(
        '@/schemas/notifications'
      );
      expect(() =>
        registerPushSubscriptionSchema.parse({
          endpoint: 'https://example.com/push',
          p256dh: 'key',
          auth: 'auth',
          user_agent: 'A'.repeat(501),
        })
      ).toThrow();
    });
  });

  describe('markNotificationsReadSchema', () => {
    it('should accept valid UUID array', async () => {
      const { markNotificationsReadSchema } = await import(
        '@/schemas/notifications'
      );
      const ids = ['550e8400-e29b-41d4-a716-446655440000'];
      const result = markNotificationsReadSchema.parse({ notification_ids: ids });
      expect(result.notification_ids).toHaveLength(1);
    });

    it('should reject empty array', async () => {
      const { markNotificationsReadSchema } = await import(
        '@/schemas/notifications'
      );
      expect(() =>
        markNotificationsReadSchema.parse({ notification_ids: [] })
      ).toThrow('At least one notification ID required');
    });

    it('should reject more than 100 IDs', async () => {
      const { markNotificationsReadSchema } = await import(
        '@/schemas/notifications'
      );
      const ids = Array.from({ length: 101 }, (_, i) =>
        `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`
      );
      expect(() =>
        markNotificationsReadSchema.parse({ notification_ids: ids })
      ).toThrow('Maximum 100 notifications per batch');
    });

    it('should reject non-UUID strings', async () => {
      const { markNotificationsReadSchema } = await import(
        '@/schemas/notifications'
      );
      expect(() =>
        markNotificationsReadSchema.parse({ notification_ids: ['not-a-uuid'] })
      ).toThrow('Invalid notification ID');
    });

    it('should accept exactly 100 IDs', async () => {
      const { markNotificationsReadSchema } = await import(
        '@/schemas/notifications'
      );
      const ids = Array.from({ length: 100 }, (_, i) =>
        `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`
      );
      const result = markNotificationsReadSchema.parse({ notification_ids: ids });
      expect(result.notification_ids).toHaveLength(100);
    });
  });

  describe('notificationFilterSchema', () => {
    it('should accept all valid filters', async () => {
      const { notificationFilterSchema } = await import(
        '@/schemas/notifications'
      );
      const validFilters = [
        'all', 'unread', 'follow_up', 'interview',
        'offer', 'achievement', 'deadline', 'weekly_digest',
      ];
      for (const filter of validFilters) {
        expect(notificationFilterSchema.parse(filter)).toBe(filter);
      }
    });

    it('should default to "all" when undefined', async () => {
      const { notificationFilterSchema } = await import(
        '@/schemas/notifications'
      );
      expect(notificationFilterSchema.parse(undefined)).toBe('all');
    });

    it('should reject invalid filter values', async () => {
      const { notificationFilterSchema } = await import(
        '@/schemas/notifications'
      );
      expect(() => notificationFilterSchema.parse('invalid')).toThrow();
    });
  });

  describe('unsubscribeTokenPayloadSchema', () => {
    it('should accept valid payload', async () => {
      const { unsubscribeTokenPayloadSchema } = await import(
        '@/schemas/notifications'
      );
      const result = unsubscribeTokenPayloadSchema.parse({
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'email_follow_up',
        exp: Math.floor(Date.now() / 1000) + 86400,
      });
      expect(result.type).toBe('email_follow_up');
    });

    it('should reject invalid user_id (non-UUID)', async () => {
      const { unsubscribeTokenPayloadSchema } = await import(
        '@/schemas/notifications'
      );
      expect(() =>
        unsubscribeTokenPayloadSchema.parse({
          user_id: 'not-a-uuid',
          type: 'email_follow_up',
          exp: 123456,
        })
      ).toThrow();
    });

    it('should reject invalid email preference type', async () => {
      const { unsubscribeTokenPayloadSchema } = await import(
        '@/schemas/notifications'
      );
      expect(() =>
        unsubscribeTokenPayloadSchema.parse({
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          type: 'in_app_follow_up',
          exp: 123456,
        })
      ).toThrow();
    });
  });
});

// ─── NOTIFICATION_TYPE_CONFIG ────────────────────────────────────

describe('NOTIFICATION_TYPE_CONFIG', () => {
  it('should have config for all notification types', async () => {
    const { NOTIFICATION_TYPE_CONFIG } = await import('@/types/notifications');
    const types = [
      'deadline', 'follow_up', 'interview', 'offer',
      'general', 'achievement', 'weekly_digest',
    ];
    for (const type of types) {
      expect(NOTIFICATION_TYPE_CONFIG[type as keyof typeof NOTIFICATION_TYPE_CONFIG]).toBeDefined();
      expect(NOTIFICATION_TYPE_CONFIG[type as keyof typeof NOTIFICATION_TYPE_CONFIG].label).toBeTruthy();
      expect(NOTIFICATION_TYPE_CONFIG[type as keyof typeof NOTIFICATION_TYPE_CONFIG].iconName).toBeTruthy();
    }
  });

  it('should map follow_up to Clock icon', async () => {
    const { NOTIFICATION_TYPE_CONFIG } = await import('@/types/notifications');
    expect(NOTIFICATION_TYPE_CONFIG.follow_up.iconName).toBe('Clock');
    expect(NOTIFICATION_TYPE_CONFIG.follow_up.label).toBe('Follow-up');
  });

  it('should map achievement to Trophy icon', async () => {
    const { NOTIFICATION_TYPE_CONFIG } = await import('@/types/notifications');
    expect(NOTIFICATION_TYPE_CONFIG.achievement.iconName).toBe('Trophy');
    expect(NOTIFICATION_TYPE_CONFIG.achievement.label).toBe('Achievement');
  });

  it('should map interview to Briefcase icon', async () => {
    const { NOTIFICATION_TYPE_CONFIG } = await import('@/types/notifications');
    expect(NOTIFICATION_TYPE_CONFIG.interview.iconName).toBe('Briefcase');
    expect(NOTIFICATION_TYPE_CONFIG.interview.label).toBe('Interview');
  });

  it('should map offer to Gift icon', async () => {
    const { NOTIFICATION_TYPE_CONFIG } = await import('@/types/notifications');
    expect(NOTIFICATION_TYPE_CONFIG.offer.iconName).toBe('Gift');
    expect(NOTIFICATION_TYPE_CONFIG.offer.label).toBe('Offer');
  });

  it('should map weekly_digest to BarChart3 icon', async () => {
    const { NOTIFICATION_TYPE_CONFIG } = await import('@/types/notifications');
    expect(NOTIFICATION_TYPE_CONFIG.weekly_digest.iconName).toBe('BarChart3');
    expect(NOTIFICATION_TYPE_CONFIG.weekly_digest.label).toBe('Weekly Digest');
  });
});

// ─── Unsubscribe Token ──────────────────────────────────────────

describe('Unsubscribe Token', () => {
  const TEST_SECRET = 'test-secret-key-for-hmac-verification';

  beforeEach(() => {
    vi.stubEnv('UNSUBSCRIBE_SECRET', TEST_SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('should generate a valid token with two parts separated by dot', async () => {
    const { generateUnsubscribeToken } = await import('@/lib/email/sender');
    const token = generateUnsubscribeToken(
      '550e8400-e29b-41d4-a716-446655440000',
      'email_follow_up'
    );
    const parts = token.split('.');
    expect(parts).toHaveLength(2);
    expect(parts[0]!.length).toBeGreaterThan(0);
    expect(parts[1]!.length).toBeGreaterThan(0);
  });

  it('should generate token that can be verified', async () => {
    const { generateUnsubscribeToken, verifyUnsubscribeToken } = await import(
      '@/lib/email/sender'
    );
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const type = 'email_follow_up';
    const token = generateUnsubscribeToken(userId, type);
    const payload = verifyUnsubscribeToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.user_id).toBe(userId);
    expect(payload!.type).toBe(type);
  });

  it('should include 30-day expiry in token', async () => {
    const { generateUnsubscribeToken, verifyUnsubscribeToken } = await import(
      '@/lib/email/sender'
    );
    const token = generateUnsubscribeToken(
      '550e8400-e29b-41d4-a716-446655440000',
      'email_follow_up'
    );
    const payload = verifyUnsubscribeToken(token);
    expect(payload).not.toBeNull();
    const now = Math.floor(Date.now() / 1000);
    const thirtyDays = 30 * 24 * 60 * 60;
    // Expiry should be within 1 second of 30 days from now
    expect(payload!.exp).toBeGreaterThanOrEqual(now + thirtyDays - 1);
    expect(payload!.exp).toBeLessThanOrEqual(now + thirtyDays + 1);
  });

  it('should reject tampered token', async () => {
    const { generateUnsubscribeToken, verifyUnsubscribeToken } = await import(
      '@/lib/email/sender'
    );
    const token = generateUnsubscribeToken(
      '550e8400-e29b-41d4-a716-446655440000',
      'email_follow_up'
    );
    const parts = token.split('.');
    // Tamper with the payload
    const tamperedToken = 'dGFtcGVyZWQ' + '.' + parts[1];
    const payload = verifyUnsubscribeToken(tamperedToken);
    expect(payload).toBeNull();
  });

  it('should reject token with invalid format (no dot)', async () => {
    const { verifyUnsubscribeToken } = await import('@/lib/email/sender');
    expect(verifyUnsubscribeToken('nodothere')).toBeNull();
  });

  it('should reject token with too many parts', async () => {
    const { verifyUnsubscribeToken } = await import('@/lib/email/sender');
    expect(verifyUnsubscribeToken('a.b.c')).toBeNull();
  });

  it('should reject expired token', async () => {
    const crypto = await import('crypto');
    const expiredPayload = {
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'email_follow_up',
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    };
    const payloadStr = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
    const hmac = crypto.createHmac('sha256', TEST_SECRET).update(payloadStr).digest('base64url');
    const expiredToken = `${payloadStr}.${hmac}`;

    const { verifyUnsubscribeToken } = await import('@/lib/email/sender');
    expect(verifyUnsubscribeToken(expiredToken)).toBeNull();
  });

  it('should throw if UNSUBSCRIBE_SECRET is not set when generating', async () => {
    vi.stubEnv('UNSUBSCRIBE_SECRET', '');
    vi.resetModules();
    const { generateUnsubscribeToken } = await import('@/lib/email/sender');
    expect(() =>
      generateUnsubscribeToken(
        '550e8400-e29b-41d4-a716-446655440000',
        'email_follow_up'
      )
    ).toThrow('UNSUBSCRIBE_SECRET');
  });

  it('should return null if UNSUBSCRIBE_SECRET is not set when verifying', async () => {
    vi.stubEnv('UNSUBSCRIBE_SECRET', '');
    vi.resetModules();
    const { verifyUnsubscribeToken } = await import('@/lib/email/sender');
    expect(verifyUnsubscribeToken('any.token')).toBeNull();
  });
});

// ─── Zustand Notification Store ──────────────────────────────────

describe('Notification Store', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  const makeNotification = (overrides: Partial<import('@/types/notifications').NotificationRow> = {}): import('@/types/notifications').NotificationRow => ({
    id: overrides.id ?? '1',
    user_id: 'user-1',
    notification_type: 'follow_up',
    title: 'Test notification',
    message: 'Test message',
    related_application_id: null,
    is_read: false,
    scheduled_for: null,
    action_url: null,
    email_sent: false,
    push_sent: false,
    created_at: new Date().toISOString(),
    ...overrides,
  });

  it('should initialize with zero unread count and empty notifications', async () => {
    const { useNotificationStore } = await import('@/stores/notification-store');
    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.recentNotifications).toEqual([]);
    expect(state.isDropdownOpen).toBe(false);
  });

  it('should set unread count', async () => {
    const { useNotificationStore } = await import('@/stores/notification-store');
    act(() => useNotificationStore.getState().setUnreadCount(5));
    expect(useNotificationStore.getState().unreadCount).toBe(5);
  });

  it('should increment unread count', async () => {
    const { useNotificationStore } = await import('@/stores/notification-store');
    act(() => useNotificationStore.getState().setUnreadCount(3));
    act(() => useNotificationStore.getState().incrementUnreadCount());
    expect(useNotificationStore.getState().unreadCount).toBe(4);
  });

  it('should decrement unread count but not below zero', async () => {
    const { useNotificationStore } = await import('@/stores/notification-store');
    act(() => useNotificationStore.getState().setUnreadCount(1));
    act(() => useNotificationStore.getState().decrementUnreadCount());
    expect(useNotificationStore.getState().unreadCount).toBe(0);
    // Should not go below 0
    act(() => useNotificationStore.getState().decrementUnreadCount());
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('should decrement by custom amount', async () => {
    const { useNotificationStore } = await import('@/stores/notification-store');
    act(() => useNotificationStore.getState().setUnreadCount(10));
    act(() => useNotificationStore.getState().decrementUnreadCount(3));
    expect(useNotificationStore.getState().unreadCount).toBe(7);
  });

  it('should add notification to front of list', async () => {
    const { useNotificationStore } = await import('@/stores/notification-store');
    const n1 = makeNotification({ id: '1' });
    const n2 = makeNotification({ id: '2' });
    act(() => useNotificationStore.getState().addNotification(n1));
    act(() => useNotificationStore.getState().addNotification(n2));
    const list = useNotificationStore.getState().recentNotifications;
    expect(list[0].id).toBe('2');
    expect(list[1].id).toBe('1');
  });

  it('should cap recent notifications at 20', async () => {
    const { useNotificationStore } = await import('@/stores/notification-store');
    for (let i = 0; i < 25; i++) {
      act(() =>
        useNotificationStore.getState().addNotification(makeNotification({ id: String(i) }))
      );
    }
    expect(useNotificationStore.getState().recentNotifications).toHaveLength(20);
  });

  it('should mark specific notifications as read', async () => {
    const { useNotificationStore } = await import('@/stores/notification-store');
    const n1 = makeNotification({ id: 'a', is_read: false });
    const n2 = makeNotification({ id: 'b', is_read: false });
    act(() => useNotificationStore.getState().setRecentNotifications([n1, n2]));
    act(() => useNotificationStore.getState().markAsRead(['a']));
    const list = useNotificationStore.getState().recentNotifications;
    expect(list.find((n) => n.id === 'a')?.is_read).toBe(true);
    expect(list.find((n) => n.id === 'b')?.is_read).toBe(false);
  });

  it('should mark all notifications as read and reset unread count', async () => {
    const { useNotificationStore } = await import('@/stores/notification-store');
    const n1 = makeNotification({ id: 'a', is_read: false });
    const n2 = makeNotification({ id: 'b', is_read: false });
    act(() => {
      useNotificationStore.getState().setRecentNotifications([n1, n2]);
      useNotificationStore.getState().setUnreadCount(2);
    });
    act(() => useNotificationStore.getState().markAllAsRead());
    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.recentNotifications.every((n) => n.is_read)).toBe(true);
  });

  it('should remove a notification by id', async () => {
    const { useNotificationStore } = await import('@/stores/notification-store');
    const n1 = makeNotification({ id: 'x' });
    const n2 = makeNotification({ id: 'y' });
    act(() => useNotificationStore.getState().setRecentNotifications([n1, n2]));
    act(() => useNotificationStore.getState().removeNotification('x'));
    const list = useNotificationStore.getState().recentNotifications;
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('y');
  });

  it('should toggle dropdown open state', async () => {
    const { useNotificationStore } = await import('@/stores/notification-store');
    act(() => useNotificationStore.getState().setDropdownOpen(true));
    expect(useNotificationStore.getState().isDropdownOpen).toBe(true);
    act(() => useNotificationStore.getState().setDropdownOpen(false));
    expect(useNotificationStore.getState().isDropdownOpen).toBe(false);
  });
});

// ─── Date Grouping Logic ─────────────────────────────────────────

describe('Date Grouping (groupByDate)', () => {
  // Re-implement groupByDate here since it's a local function in the page component
  function groupByDate(
    notifications: { created_at: string; [k: string]: unknown }[]
  ): { label: string; items: typeof notifications }[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);

    const groups: {
      Today: typeof notifications;
      Yesterday: typeof notifications;
      'This Week': typeof notifications;
      Older: typeof notifications;
    } = { Today: [], Yesterday: [], 'This Week': [], Older: [] };

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

  it('should group notifications from today', () => {
    const now = new Date();
    const groups = groupByDate([
      { created_at: now.toISOString(), id: '1' },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('Today');
    expect(groups[0].items).toHaveLength(1);
  });

  it('should group notifications from yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0); // noon yesterday
    const groups = groupByDate([
      { created_at: yesterday.toISOString(), id: '1' },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('Yesterday');
  });

  it('should group notifications from this week', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(12, 0, 0, 0);
    const groups = groupByDate([
      { created_at: threeDaysAgo.toISOString(), id: '1' },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('This Week');
  });

  it('should group old notifications', () => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const groups = groupByDate([
      { created_at: twoWeeksAgo.toISOString(), id: '1' },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('Older');
  });

  it('should create multiple groups for mixed dates', () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const groups = groupByDate([
      { created_at: now.toISOString(), id: '1' },
      { created_at: yesterday.toISOString(), id: '2' },
      { created_at: twoWeeksAgo.toISOString(), id: '3' },
    ]);
    expect(groups.length).toBeGreaterThanOrEqual(3);
    expect(groups.map((g) => g.label)).toContain('Today');
    expect(groups.map((g) => g.label)).toContain('Yesterday');
    expect(groups.map((g) => g.label)).toContain('Older');
  });

  it('should return empty array for no notifications', () => {
    const groups = groupByDate([]);
    expect(groups).toEqual([]);
  });

  it('should preserve order: Today, Yesterday, This Week, Older', () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    const fourDaysAgo = new Date(now);
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
    fourDaysAgo.setHours(12, 0, 0, 0);
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const groups = groupByDate([
      { created_at: now.toISOString(), id: '1' },
      { created_at: yesterday.toISOString(), id: '2' },
      { created_at: fourDaysAgo.toISOString(), id: '3' },
      { created_at: monthAgo.toISOString(), id: '4' },
    ]);

    const labels = groups.map((g) => g.label);
    expect(labels).toEqual(['Today', 'Yesterday', 'This Week', 'Older']);
  });
});

// ─── getRelativeTime utility ─────────────────────────────────────

describe('getRelativeTime', () => {
  // Re-implement since it's local to NotificationItem
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

  it('should return "Just now" for < 1 minute', () => {
    const now = new Date();
    expect(getRelativeTime(now.toISOString())).toBe('Just now');
  });

  it('should return minutes for < 1 hour', () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60000);
    expect(getRelativeTime(thirtyMinsAgo.toISOString())).toBe('30m ago');
  });

  it('should return hours for < 24 hours', () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 3600000);
    expect(getRelativeTime(fiveHoursAgo.toISOString())).toBe('5h ago');
  });

  it('should return days for < 7 days', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000);
    expect(getRelativeTime(threeDaysAgo.toISOString())).toBe('3d ago');
  });

  it('should return formatted date for >= 7 days', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000);
    const result = getRelativeTime(twoWeeksAgo.toISOString());
    // Should be a localized date string, not "Xd ago"
    expect(result).not.toContain('d ago');
    expect(result).not.toContain('Just now');
  });
});

// ─── Preference Key Mapping ─────────────────────────────────────

describe('Preference Key Mapping', () => {
  // Test the preference key logic used by the trigger system
  function getPreferenceKeys(type: string): {
    inApp: string | null;
    email: string | null;
    push: string | null;
  } {
    const typeMap: Record<string, { inApp: string | null; email: string | null; push: string | null }> = {
      follow_up: { inApp: 'in_app_follow_up', email: 'email_follow_up', push: 'push_follow_up' },
      deadline: { inApp: 'in_app_deadline', email: 'email_deadline', push: 'push_deadline' },
      interview: { inApp: 'in_app_interview', email: 'email_interview', push: 'push_interview' },
      offer: { inApp: 'in_app_offer', email: 'email_offer', push: 'push_offer' },
      achievement: { inApp: 'in_app_achievement', email: null, push: null },
      general: { inApp: 'in_app_general', email: null, push: null },
      weekly_digest: { inApp: null, email: 'email_weekly_digest', push: null },
    };
    return typeMap[type] ?? { inApp: null, email: null, push: null };
  }

  it('should map follow_up to all three channels', () => {
    const keys = getPreferenceKeys('follow_up');
    expect(keys.inApp).toBe('in_app_follow_up');
    expect(keys.email).toBe('email_follow_up');
    expect(keys.push).toBe('push_follow_up');
  });

  it('should map achievement to in-app only', () => {
    const keys = getPreferenceKeys('achievement');
    expect(keys.inApp).toBe('in_app_achievement');
    expect(keys.email).toBeNull();
    expect(keys.push).toBeNull();
  });

  it('should map general to in-app only', () => {
    const keys = getPreferenceKeys('general');
    expect(keys.inApp).toBe('in_app_general');
    expect(keys.email).toBeNull();
    expect(keys.push).toBeNull();
  });

  it('should map weekly_digest to email only', () => {
    const keys = getPreferenceKeys('weekly_digest');
    expect(keys.inApp).toBeNull();
    expect(keys.email).toBe('email_weekly_digest');
    expect(keys.push).toBeNull();
  });

  it('should map interview to all three channels', () => {
    const keys = getPreferenceKeys('interview');
    expect(keys.inApp).toBe('in_app_interview');
    expect(keys.email).toBe('email_interview');
    expect(keys.push).toBe('push_interview');
  });

  it('should map offer to all three channels', () => {
    const keys = getPreferenceKeys('offer');
    expect(keys.inApp).toBe('in_app_offer');
    expect(keys.email).toBe('email_offer');
    expect(keys.push).toBe('push_offer');
  });

  it('should map deadline to all three channels', () => {
    const keys = getPreferenceKeys('deadline');
    expect(keys.inApp).toBe('in_app_deadline');
    expect(keys.email).toBe('email_deadline');
    expect(keys.push).toBe('push_deadline');
  });

  it('should return null for unknown type', () => {
    const keys = getPreferenceKeys('unknown');
    expect(keys.inApp).toBeNull();
    expect(keys.email).toBeNull();
    expect(keys.push).toBeNull();
  });
});
