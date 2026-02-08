'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/actions/notifications';
import { useToast } from '@/hooks/use-toast';
import { PushPermissionPrompt } from './PushPermissionPrompt';
import type { NotificationPreferences } from '@/types/notifications';

interface PreferenceToggle {
  key: keyof NotificationPreferences;
  label: string;
}

const IN_APP_TOGGLES: PreferenceToggle[] = [
  { key: 'in_app_follow_up', label: 'Follow-up reminders' },
  { key: 'in_app_deadline', label: 'Deadline alerts' },
  { key: 'in_app_interview', label: 'Interview updates' },
  { key: 'in_app_offer', label: 'Offer notifications' },
  { key: 'in_app_achievement', label: 'Achievement celebrations' },
  { key: 'in_app_general', label: 'General updates' },
];

const EMAIL_TOGGLES: PreferenceToggle[] = [
  { key: 'email_follow_up', label: 'Follow-up reminders' },
  { key: 'email_deadline', label: 'Deadline alerts' },
  { key: 'email_interview', label: 'Interview updates' },
  { key: 'email_offer', label: 'Offer notifications' },
  { key: 'email_weekly_digest', label: 'Weekly digest summary' },
];

const PUSH_TOGGLES: PreferenceToggle[] = [
  { key: 'push_follow_up', label: 'Follow-up reminders' },
  { key: 'push_deadline', label: 'Deadline alerts' },
  { key: 'push_interview', label: 'Interview updates' },
  { key: 'push_offer', label: 'Offer notifications' },
];

export function NotificationPreferencesSection() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadPreferences = useCallback(async () => {
    const result = await getNotificationPreferences();
    if (result.success) {
      setPreferences(result.data);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;

    // Optimistic update
    const prev = { ...preferences };
    setPreferences({ ...preferences, [key]: value });

    const result = await updateNotificationPreferences({ [key]: value });
    if (!result.success) {
      // Rollback
      setPreferences(prev);
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-white dark:bg-gray-800 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notification Preferences
        </h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-white dark:bg-gray-800 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Notification Preferences
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Control how and when you receive notifications.
      </p>

      {/* In-App Notifications */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          In-App Notifications
        </h3>
        <div className="space-y-3">
          {IN_APP_TOGGLES.map((toggle) => (
            <div key={toggle.key} className="flex items-center justify-between">
              <Label htmlFor={toggle.key} className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                {toggle.label}
              </Label>
              <Switch
                id={toggle.key}
                checked={preferences[toggle.key] as boolean}
                onCheckedChange={(checked) => handleToggle(toggle.key, checked)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Email Notifications */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Email Notifications
        </h3>
        <div className="space-y-3">
          {EMAIL_TOGGLES.map((toggle) => (
            <div key={toggle.key} className="flex items-center justify-between">
              <Label htmlFor={toggle.key} className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                {toggle.label}
              </Label>
              <Switch
                id={toggle.key}
                checked={preferences[toggle.key] as boolean}
                onCheckedChange={(checked) => handleToggle(toggle.key, checked)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Push Notifications */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Browser Push Notifications
        </h3>
        <div className="mb-4">
          <PushPermissionPrompt />
        </div>
        <div className="space-y-3">
          {PUSH_TOGGLES.map((toggle) => (
            <div key={toggle.key} className="flex items-center justify-between">
              <Label htmlFor={toggle.key} className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                {toggle.label}
              </Label>
              <Switch
                id={toggle.key}
                checked={preferences[toggle.key] as boolean}
                onCheckedChange={(checked) => handleToggle(toggle.key, checked)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
