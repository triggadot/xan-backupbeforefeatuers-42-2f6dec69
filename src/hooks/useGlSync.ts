
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { glSyncApi } from '@/services/glsync';
import { GlideTable, ProductSyncResult } from '@/types/glsync';

export function useGlSync() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [glideTables, setGlideTables] = useState<GlideTable[]>([]);

  const fetchGlideTables = async (connectionId: string): Promise<{tables?: GlideTable[], error?: string}> => {
    try {
      setIsLoading(true);
      console.log(`Fetching Glide tables for connection ${connectionId}`);
      const result = await glSyncApi.listGlideTables(connectionId);
      
      if ('error' in result) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return { error: result.error };
      }
      
      console.log('Fetched Glide tables:', result.tables);
      setGlideTables(result.tables);
      return { tables: result.tables };
    } catch (error) {
      console.error('Error fetching Glide tables:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch Glide tables',
        variant: 'destructive',
      });
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  };

  const syncData = async (connectionId: string, mappingId: string): Promise<ProductSyncResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await glSyncApi.syncData(connectionId, mappingId);
      
      if (!result.success) {
        const errorMessage = result.error || 'An unknown error occurred during sync';
        setError(errorMessage);
        toast({
          title: 'Sync Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }

      return {
        success: result.success,
        error: result.error,
        recordsProcessed: result.recordsProcessed || 0,
        failedRecords: result.failedRecords || 0
      };
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

  const retryFailedSync = async (connectionId: string, mappingId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Use syncData action instead of retryFailedSync since that's not a valid action type
      const { data, error } = await glSyncApi.callSyncFunction({
        action: "syncData",  // Changed from "retryFailedSync" to "syncData"
        connectionId,
        mappingId,
      });

      if (error) throw new Error(error.message);
      
      toast({
        title: 'Retry initiated',
        description: 'Retry of failed synchronization has been initiated.',
      });
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during retry';
      setError(message);
      toast({
        title: 'Retry Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    glideTables,
    fetchGlideTables,
    syncData,
    retryFailedSync,
    error
  };
}
