
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GlMapping, ProductSyncResult } from '@/types/glsync';

export function useGlSync() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<ProductSyncResult | null>(null);
  const { toast } = useToast();

  const syncData = async (connectionId: string, mappingId: string) => {
    setIsLoading(true);
    setSyncResult(null);
    
    try {
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
          description: `Successfully processed ${data.recordsProcessed} records`,
        });
      } else {
        toast({
          title: 'Sync had issues',
          description: data.error || `Processed ${data.recordsProcessed} records with ${data.failedRecords} failures`,
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

  return {
    syncData,
    testConnection,
    listGlideTables,
    getGlideTableColumns,
    isLoading,
    syncResult
  };
}
