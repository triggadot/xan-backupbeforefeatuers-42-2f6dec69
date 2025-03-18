
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProductSyncResult } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';

export function useGlSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ProductSyncResult | null>(null);
  const { toast } = useToast();

  const syncData = async (connectionId: string, mappingId: string): Promise<ProductSyncResult> => {
    setIsLoading(true);
    setLastResult(null);
    
    try {
      console.log(`Starting sync for mapping ${mappingId} with connection ${connectionId}`);
      
      // First check connection status
      const { data: connection, error: connectionError } = await supabase
        .from('gl_connections')
        .select('status, api_key, app_id')
        .eq('id', connectionId)
        .single();
      
      if (connectionError) {
        throw new Error(`Connection error: ${connectionError.message}`);
      }
      
      if (!connection) {
        throw new Error('Connection not found');
      }
      
      if (connection.status !== 'active') {
        // Update connection status to testing
        await supabase
          .from('gl_connections')
          .update({ status: 'testing' })
          .eq('id', connectionId);
          
        // Test the connection
        const testResult = await supabase.functions.invoke('glsync', {
          body: {
            action: 'testConnection',
            connectionId: connectionId,
          },
        });
        
        if (testResult.error) {
          await supabase
            .from('gl_connections')
            .update({ status: 'error' })
            .eq('id', connectionId);
            
          throw new Error(`Connection test failed: ${testResult.error}`);
        }
        
        // Update connection to active
        await supabase
          .from('gl_connections')
          .update({ status: 'active' })
          .eq('id', connectionId);
      }
      
      // Call the sync function
      const result = await supabase.functions.invoke('glsync', {
        body: {
          action: 'syncData',
          connectionId: connectionId,
          mappingId: mappingId,
        },
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      console.log('Sync result:', result.data);
      
      const syncResult = {
        success: result.data.success ?? false,
        recordsProcessed: result.data.recordsProcessed || 0,
        failedRecords: result.data.failedRecords || 0,
        errors: result.data.errors || [],
        total_records: result.data.total_records,
        processed_records: result.data.processed_records,
        failed_records: result.data.failed_records,
      };
      
      setLastResult(syncResult);
      
      if (syncResult.success) {
        toast({
          title: 'Sync completed',
          description: `Successfully processed ${syncResult.recordsProcessed} records.`,
        });
      } else {
        toast({
          title: 'Sync completed with issues',
          description: `Processed ${syncResult.recordsProcessed} records with ${syncResult.failedRecords} failures.`,
          variant: 'destructive',
        });
      }
      
      return syncResult;
    } catch (error) {
      console.error('Error during sync:', error);
      
      const failedResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        recordsProcessed: 0,
        failedRecords: 1
      };
      
      setLastResult(failedResult);
      
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred during sync',
        variant: 'destructive',
      });
      
      return failedResult;
    } finally {
      setIsLoading(false);
    }
  };
  
  const retryFailedSync = async (mappingId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Call the retry RPC function
      const { data, error } = await supabase.rpc('glsync_retry_failed_sync', {
        p_mapping_id: mappingId
      });
      
      if (error) {
        throw new Error(`Failed to retry sync: ${error.message}`);
      }
      
      if (data) {
        toast({
          title: 'Retry initiated',
          description: 'The failed sync operation has been queued for retry.',
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error retrying sync:', error);
      
      toast({
        title: 'Retry failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const validateConnection = async (connectionId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const result = await supabase.functions.invoke('glsync', {
        body: {
          action: 'testConnection',
          connectionId: connectionId,
        },
      });
      
      const success = !result.error && result.data && result.data.success;
      
      if (success) {
        // Update connection status to active
        await supabase
          .from('gl_connections')
          .update({ status: 'active' })
          .eq('id', connectionId);
          
        toast({
          title: 'Connection successful',
          description: 'Successfully connected to Glide API.',
        });
      } else {
        // Update connection status to error
        await supabase
          .from('gl_connections')
          .update({ status: 'error' })
          .eq('id', connectionId);
          
        toast({
          title: 'Connection failed',
          description: result.error || 'Unknown error occurred',
          variant: 'destructive',
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error validating connection:', error);
      
      // Update connection status to error
      await supabase
        .from('gl_connections')
        .update({ status: 'error' })
        .eq('id', connectionId);
        
      toast({
        title: 'Connection validation failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    syncData,
    retryFailedSync,
    validateConnection,
    isLoading,
    lastResult
  };
}
