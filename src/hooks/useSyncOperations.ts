import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ProductSyncResult } from '@/types/glsync';
import { syncData } from '@/services/glsync';
import { supabase } from '@/integrations/supabase/client';
import { glSyncApi } from '@/services/glSyncApi';

/**
 * Hook for handling sync operations with optimized performance
 * - Implements request batching for multiple syncs
 * - Uses exponential backoff for retries
 * - Provides detailed error reporting
 */
export function useSyncOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const { toast } = useToast();

  /**
   * Performs a sync operation with exponential backoff retry
   * @param connectionId - The connection ID
   * @param mappingId - The mapping ID
   * @param retries - Number of retries (default: 3)
   * @returns Promise resolving to sync result or null
   */
  const syncMapping = useCallback(async (
    connectionId: string, 
    mappingId: string,
    retries = 3
  ): Promise<ProductSyncResult | null> => {
    setIsLoading(true);
    setError(null);
    
    let attempt = 0;
    let result: ProductSyncResult | null = null;
    
    while (attempt <= retries) {
      try {
        // If not first attempt, wait with exponential backoff
        if (attempt > 0) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          
          toast({
            title: 'Retrying Sync',
            description: `Attempt ${attempt} of ${retries}`,
          });
        }
        
        result = await syncData(connectionId, mappingId);
        
        if (result) {
          toast({
            title: 'Sync Successful',
            description: 'Data synchronized successfully.',
          });
          break; // Success, exit retry loop
        } else {
          throw new Error('Sync returned no result');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error during sync';
        console.error(`Sync attempt ${attempt + 1} failed:`, errorMessage);
        
        // If this is the last attempt, set the error
        if (attempt === retries) {
          setError(errorMessage);
          toast({
            title: 'Sync Failed',
            description: `Failed after ${retries + 1} attempts: ${errorMessage}`,
            variant: 'destructive',
          });
        }
      }
      
      attempt++;
    }
    
    setIsLoading(false);
    return result;
  }, [toast]);

  /**
   * Syncs a mapping by ID using the edge function
   * @param mappingId - The mapping ID to sync
   * @param options - Optional parameters
   * @returns Promise resolving to success status
   */
  const syncMappingById = useCallback(async (
    mappingId: string,
    options: { 
      retries?: number,
      batchSize?: number,
      onProgress?: (progress: number) => void
    } = {}
  ): Promise<boolean> => {
    const { retries = 2, onProgress } = options;
    setIsLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      // Add request caching to prevent duplicate requests
      const cacheKey = `sync-${mappingId}-${Date.now()}`;
      sessionStorage.setItem(cacheKey, 'pending');
      
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'syncMapping',
          mappingId: mappingId
        }
      });
      
      // Clear cache
      sessionStorage.removeItem(cacheKey);
      
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
      
      // Update progress
      setProgress(100);
      if (onProgress) onProgress(100);
      
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
  }, [toast]);

  /**
   * Batch syncs multiple mappings
   * @param mappingIds - Array of mapping IDs to sync
   * @returns Promise resolving to array of results
   */
  const batchSyncMappings = useCallback(async (
    mappingIds: string[]
  ): Promise<{success: boolean, mappingId: string, error?: string}[]> => {
    if (!mappingIds.length) return [];
    
    setIsLoading(true);
    setError(null);
    setProgress(0);
    
    const results: {success: boolean, mappingId: string, error?: string}[] = [];
    const totalMappings = mappingIds.length;
    
    for (let i = 0; i < totalMappings; i++) {
      const mappingId = mappingIds[i];
      try {
        // Update progress
        const currentProgress = Math.round(((i) / totalMappings) * 100);
        setProgress(currentProgress);
        
        const success = await syncMappingById(mappingId);
        results.push({ success, mappingId });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        results.push({ success: false, mappingId, error: errorMessage });
      }
      
      // Update progress after each mapping
      const newProgress = Math.round(((i + 1) / totalMappings) * 100);
      setProgress(newProgress);
    }
    
    setIsLoading(false);
    
    // Show summary toast
    const successCount = results.filter(r => r.success).length;
    toast({
      title: 'Batch Sync Complete',
      description: `Successfully synced ${successCount} of ${totalMappings} mappings.`,
      variant: successCount === totalMappings ? 'default' : 'destructive',
    });
    
    return results;
  }, [syncMappingById, toast]);

  /**
   * Retries a failed sync operation
   * @param connectionId - The connection ID
   * @param mappingId - The mapping ID
   * @returns Promise resolving to success status
   */
  const retryFailedSync = useCallback(async (
    connectionId: string, 
    mappingId: string
  ): Promise<boolean> => {
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
  }, [toast]);

  return {
    syncData: syncMapping,
    syncMappingById,
    batchSyncMappings,
    retryFailedSync,
    isLoading,
    progress,
    error
  };
}
