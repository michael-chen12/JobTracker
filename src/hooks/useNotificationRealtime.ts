'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useNotificationStore } from '@/stores/notification-store';
import { useToast } from '@/hooks/use-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { NotificationRow } from '@/types/notifications';

/**
 * Subscribe to Supabase Realtime INSERT events on the notifications table.
 * Filtered by user_id so only this user's notifications are received.
 * Auto-reconnects on channel error.
 */
export function useNotificationRealtime(userId: string | null) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as NotificationRow;

          // Get store actions inside callback to avoid dependency issues
          const { addNotification, incrementUnreadCount } = useNotificationStore.getState();
          addNotification(newNotification);
          incrementUnreadCount();

          // Show toast for new notification
          toast({
            title: newNotification.title,
            description:
              newNotification.message.length > 100
                ? `${newNotification.message.slice(0, 100)}...`
                : newNotification.message,
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          // Retry after 5 seconds
          setTimeout(() => {
            channel.subscribe();
          }, 5000);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, toast]);
}
