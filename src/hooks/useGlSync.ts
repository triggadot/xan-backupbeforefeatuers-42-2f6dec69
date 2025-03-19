
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { glSyncApi } from '@/services/glsync';
import { GlideTable, ProductSyncResult } from '@/types/glsync';
import { supabase } from '@/integrations/supabase/client';

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

  const syncData = useCallback(async (connectionId: string, mappingId: string): Promise<ProductSyncResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Log the start of sync for monitoring
      console.log(`Starting sync for mapping ID: ${mappingId}, connection ID: ${connectionId}`);
      
      const result = await glSyncApi.syncData(connectionId, mappingId);
      
      if (!result.success) {
        const errorMessage = result.error || 'An unknown error occurred during sync';
        setError(errorMessage);
        toast({
          title: 'Sync Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Sync Complete',
          description: `Successfully processed ${result.recordsProcessed} records with ${result.failedRecords} failures.`,
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
  }, [toast]);

  const getAccountsMappingId = useCallback(async (): Promise<string | null> => {
    try {
      // Find the mapping for gl_accounts table
      const { data, error } = await supabase
        .from('gl_mappings')
        .select('id')
        .eq('supabase_table', 'gl_accounts')
        .single();
      
      if (error) {
        console.error('Error fetching accounts mapping:', error);
        return null;
      }
      
      return data?.id || null;
    } catch (error) {
      console.error('Error getting accounts mapping ID:', error);
      return null;
    }
  }, []);

  const syncAccounts = useCallback(async (connectionId: string): Promise<ProductSyncResult> => {
    const mappingId = await getAccountsMappingId();
    
    if (!mappingId) {
      const errorMsg = 'No mapping found for accounts table';
      toast({
        title: 'Sync Error',
        description: errorMsg,
        variant: 'destructive',
      });
      return {
        success: false,
        error: errorMsg,
        recordsProcessed: 0,
        failedRecords: 0
      };
    }
    
    return syncData(connectionId, mappingId);
  }, [getAccountsMappingId, syncData, toast]);

  const retryFailedSync = async (connectionId: string, mappingId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Use syncData action instead of retryFailedSync
      const result = await syncData(connectionId, mappingId);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast({
        title: 'Retry successful',
        description: `Processed ${result.recordsProcessed} records during retry.`,
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
    syncAccounts,
    retryFailedSync,
    getAccountsMappingId,
    error
  };
}
