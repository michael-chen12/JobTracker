'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import {
  registerPushSubscription,
  unregisterPushSubscription,
} from '@/actions/notifications';
import { useToast } from '@/hooks/use-toast';

type PushStatus = 'loading' | 'unsupported' | 'denied' | 'enabled' | 'disabled';

export function PushPermissionPrompt() {
  const [status, setStatus] = useState<PushStatus>('loading');
  const [toggling, setToggling] = useState(false);
  const { toast } = useToast();

  const checkStatus = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }

    const permission = Notification.permission;
    if (permission === 'denied') {
      setStatus('denied');
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      setStatus(subscription ? 'enabled' : 'disabled');
    } else {
      setStatus('disabled');
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleEnable = async () => {
    setToggling(true);
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      // Get VAPID public key
      const response = await fetch('/api/push/vapid-public-key');
      const { publicKey, error } = await response.json();
      if (error || !publicKey) {
        toast({
          title: 'Push not available',
          description: 'Push notifications are not configured on this server.',
          variant: 'destructive',
        });
        setToggling(false);
        return;
      }

      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
      const subJSON = subscription.toJSON();
      const result = await registerPushSubscription({
        endpoint: subJSON.endpoint!,
        p256dh: subJSON.keys!.p256dh,
        auth: subJSON.keys!.auth,
        user_agent: navigator.userAgent,
      });

      if (result.success) {
        setStatus('enabled');
        toast({ title: 'Push notifications enabled' });
      } else {
        toast({
          title: 'Failed to enable',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Push enable error:', err);
      if (Notification.permission === 'denied') {
        setStatus('denied');
        toast({
          title: 'Permission denied',
          description: 'Enable notifications in your browser settings.',
          variant: 'destructive',
        });
      }
    }
    setToggling(false);
  };

  const handleDisable = async () => {
    setToggling(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await unregisterPushSubscription(subscription.endpoint);
          await subscription.unsubscribe();
        }
      }
      setStatus('disabled');
      toast({ title: 'Push notifications disabled' });
    } catch (err) {
      console.error('Push disable error:', err);
    }
    setToggling(false);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking push notification status...
      </div>
    );
  }

  if (status === 'unsupported') {
    return (
      <p className="text-sm text-gray-500">
        Push notifications are not supported in this browser.
      </p>
    );
  }

  if (status === 'denied') {
    return (
      <div className="flex items-center gap-2">
        <BellOff className="h-4 w-4 text-red-500" />
        <p className="text-sm text-gray-500">
          Push notifications are blocked. Enable them in your browser settings.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {status === 'enabled' ? (
        <>
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Bell className="h-4 w-4" />
            Push notifications enabled
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisable}
            disabled={toggling}
          >
            {toggling && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            Disable
          </Button>
        </>
      ) : (
        <Button onClick={handleEnable} disabled={toggling} size="sm">
          {toggling && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
          <Bell className="h-3.5 w-3.5 mr-1" />
          Enable Push Notifications
        </Button>
      )}
    </div>
  );
}

/**
 * Convert a base64 string to Uint8Array for the applicationServerKey.
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}
