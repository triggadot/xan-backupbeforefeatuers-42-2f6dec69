import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlMapping, ProductSyncResult } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';

interface UseSyncDataResult {
  syncData: (connectionId: string, mappingId: string) => Promise<ProductSyncResult>;
  isLoading: boolean;
  error: string | null;
}

export function useSyncData(): UseSyncDataResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Initiates a sync operation between Glide and Supabase
   * This calls the Edge Function that handles the sync logic
   */
  const syncData = async (connectionId: string, mappingId: string): Promise<ProductSyncResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the glsync Edge Function to perform the sync
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'syncData',
          connectionId,
          mappingId,
        },
      });

      if (error) throw new Error(error.message);

      // Show toast for successful initiation
      toast({
        title: 'Sync Initiated',
        description: 'Sync operation has been started.',
      });

      return data as ProductSyncResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during sync';
      setError(message);
      
      toast({
        title: 'Sync Error',
        description: message,
        variant: 'destructive',
      });
      
      return {
        success: false,
        error: message,
        recordsProcessed: 0,
        failedRecords: 0
      };
    } finally {
      setIsLoading(false);
    }
  };

  return { syncData, isLoading, error };
}
