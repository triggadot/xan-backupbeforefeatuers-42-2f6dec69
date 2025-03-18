import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProductSyncResult, GlMapping, GlideTable } from '@/types/glsync';
import { validateMapping } from '@/utils/gl-mapping-validator';

export function useGlSync() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<ProductSyncResult | null>(null);
  const [retrying, setRetrying] = useState<boolean>(false);
  const { toast } = useToast();

  const syncData = async (connectionId: string, mappingId: string) => {
    setIsLoading(true);
    setSyncResult(null);
    
    try {
      // First validate the mapping
      const validationResult = await validateMapping(mappingId);
      
      if (!validationResult.is_valid) {
        throw new Error(`Mapping validation failed: ${validationResult.validation_message}`);
      }
      
      // If validation passes, proceed with sync
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'syncData',
          connectionId,
          mappingId,
        },
      });

      if (error) {
        throw new Error(error.message);
      }
      
      setSyncResult(data as ProductSyncResult);
      
      if (data.success) {
        toast({
          title: 'Sync completed',
          description: `Successfully processed ${data.recordsProcessed || 0} records`,
        });
      } else {
        toast({
          title: 'Sync had issues',
          description: data.error || `Processed ${data.recordsProcessed || 0} records with ${data.failedRecords || 0} failures`,
          variant: 'destructive',
        });
      }
      
      return data;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSyncResult({ 
        success: false, 
        error: errorMessage,
        recordsProcessed: 0,
        failedRecords: 0
      });
      
      toast({
        title: 'Sync failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (connectionId: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'testConnection',
          connectionId,
        },
      });

      if (error) {
        throw new Error(error.message);
      }
      
      if (data.success) {
        toast({
          title: 'Connection successful',
          description: 'The connection to Glide API was successful.',
        });
      } else {
        toast({
          title: 'Connection failed',
          description: data.error || 'Failed to connect to Glide API',
          variant: 'destructive',
        });
      }
      
      return data;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: 'Connection test failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const listGlideTables = async (connectionId: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'listGlideTables',
          connectionId,
        },
      });

      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: 'Error listing tables',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return { 
        error: errorMessage 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const getGlideTableColumns = async (connectionId: string, tableId: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'getColumnMappings',
          connectionId,
          tableId,
        },
      });

      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: 'Error fetching columns',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return { 
        error: errorMessage 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const retryFailedSync = useCallback(async (mappingId: string): Promise<boolean> => {
    if (!mappingId) return false;
    
    try {
      setRetrying(true);
      
      // Call the RPC function to retry the failed sync
      const { data, error } = await supabase.rpc('glsync_retry_failed_sync', {
        p_mapping_id: mappingId
      });
      
      if (error) {
        console.error('Error retrying sync:', error.message);
        toast({
          title: 'Error retrying sync',
          description: error.message,
          variant: 'destructive'
        });
        return false;
      }
      
      const logId = data;
      
      toast({
        title: 'Retry initiated',
        description: 'The sync retry has been initiated successfully.'
      });
      
      // Automatically trigger the sync with the edge function
      const result = await syncData(mappingId);
      
      return result.success;
    } catch (error) {
      console.error('Error in retryFailedSync:', error);
      toast({
        title: 'Error retrying sync',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      });
      return false;
    } finally {
      setRetrying(false);
    }
  }, [syncData, setRetrying, toast]);

  return {
    syncData,
    testConnection,
    listGlideTables,
    getGlideTableColumns,
    retryFailedSync,
    isLoading,
    syncResult
  };
}
