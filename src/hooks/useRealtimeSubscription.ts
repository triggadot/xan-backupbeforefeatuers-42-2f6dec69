
import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type Table = string;
type Event = 'INSERT' | 'UPDATE' | 'DELETE' | '*';
type Callback = (payload: any) => void;

interface SubscriptionOptions {
  event?: Event;
  schema?: string;
  filter?: string;
}

export function useRealtimeSubscription(
  table: Table,
  callback: Callback,
  options: SubscriptionOptions = {}
) {
  const {
    event = '*',
    schema = 'public',
    filter = ''
  } = options;

  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Setup subscription
    channelRef.current = supabase
      .channel('table-changes')
      .on(
        'postgres_changes',
        {
          event,
          schema,
          table,
          filter
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, event, schema, filter]);

  return {
    unsubscribe: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }
  };
}
