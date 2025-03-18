
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GlideTable } from '@/types/glsync';

export function useGlSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [glideTables, setGlideTables] = useState<GlideTable[]>([]);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const fetchGlideTables = async (connectionId: string): Promise<{ tables?: GlideTable[]; error?: string }> => {
    setIsLoading(true);
    try {
      console.log('Fetching Glide tables for connection:', connectionId);
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'getTableNames',
          connectionId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setGlideTables(data.tables || []);
      return { tables: data.tables };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Glide tables';
      setError(errorMessage);
      console.error('Error fetching Glide tables:', err);
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGlideTableColumns = async (connectionId: string, tableId: string): Promise<{ columns?: any[]; error?: string }> => {
    setIsLoading(true);
    try {
      console.log('Fetching columns for Glide table:', tableId);
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'getColumnMappings',
          connectionId,
          tableId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return { columns: data.columns || [] };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Glide table columns';
      console.error('Error fetching Glide table columns:', err);
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const syncData = async (connectionId: string, mappingId: string): Promise<{
    success: boolean;
    recordsProcessed?: number;
    error?: string;
  }> => {
    setIsLoading(true);
    try {
      console.log('Syncing data for mapping:', mappingId);
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'syncData',
          connectionId,
          mappingId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return {
        success: true,
        recordsProcessed: data.recordsProcessed
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync data';
      console.error('Error syncing data:', err);
      toast({
        title: 'Sync Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const retryFailedSync = async (connectionId: string, mappingId: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    setIsLoading(true);
    try {
      console.log('Retrying failed sync for mapping:', mappingId);
      const { data, error } = await supabase.rpc('glsync_retry_failed_sync', {
        p_mapping_id: mappingId
      });

      if (error) {
        throw new Error(error.message);
      }

      // Trigger the actual sync
      return await syncData(connectionId, mappingId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry sync';
      console.error('Error retrying sync:', err);
      toast({
        title: 'Retry Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    glideTables,
    fetchGlideTables,
    fetchGlideTableColumns,
    syncData,
    retryFailedSync,
    error
  };
}
