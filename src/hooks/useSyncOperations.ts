
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ProductSyncResult } from '@/types/glsync';
import { syncData } from '@/services/glsync';
import { supabase } from '@/integrations/supabase/client';
import { glSyncApi } from '@/services/glSyncApi';

export function useSyncOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const syncMapping = async (connectionId: string, mappingId: string): Promise<ProductSyncResult | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await syncData(connectionId, mappingId);
      if (!result) {
        setError('Sync failed');
        toast({
          title: 'Sync Failed',
          description: 'Failed to synchronize data.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Sync Successful',
          description: 'Data synchronized successfully.',
        });
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during sync';
      setError(errorMessage);
      toast({
        title: 'Sync Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const syncMappingById = async (mappingId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'syncMapping',
          mappingId: mappingId
        }
      });
      
      if (error) {
        setError(`Sync failed: ${error.message}`);
        toast({
          title: 'Sync Failed',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }
      
      if (!data?.success) {
        const errorMessage = data?.error || 'Unknown error during sync';
        setError(errorMessage);
        toast({
          title: 'Sync Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      }
      
      toast({
        title: 'Sync Successful',
        description: 'Data synchronized successfully.',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during sync';
      setError(errorMessage);
      toast({
        title: 'Sync Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const retryFailedSync = async (connectionId: string, mappingId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await glSyncApi.retryFailedSync(connectionId, mappingId);
      if (!result) {
        setError('Retry failed');
        toast({
          title: 'Retry Failed',
          description: 'Failed to retry the sync operation.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Retry Successful',
          description: 'Sync operation retried successfully.',
        });
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during retry';
      setError(errorMessage);
      toast({
        title: 'Retry Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    syncData: syncMapping,
    syncMappingById,
    retryFailedSync,
    isLoading,
    error
  };
}
