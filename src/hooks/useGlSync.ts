
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProductSyncResult, GlMapping, GlideTable } from '@/types/glsync';

export function useGlSync() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<ProductSyncResult | null>(null);
  const { toast } = useToast();

  const syncData = async (connectionId: string, mappingId: string) => {
    setIsLoading(true);
    setSyncResult(null);
    
    try {
      // First validate the mapping
      const { data: validationData, error: validationError } = await supabase
        .rpc('gl_validate_column_mapping', { p_mapping_id: mappingId });
      
      if (validationError) {
        throw new Error(`Validation error: ${validationError.message}`);
      }
      
      if (validationData && !validationData[0].is_valid) {
        throw new Error(`Mapping validation failed: ${validationData[0].validation_message}`);
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

  const retryFailedSync = async (mappingId: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .rpc('glsync_retry_failed_sync', { p_mapping_id: mappingId });
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: 'Sync retry initiated',
        description: 'The failed sync operation has been queued for retry.',
      });
      
      return { success: true, logId: data };
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: 'Error retrying sync',
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
