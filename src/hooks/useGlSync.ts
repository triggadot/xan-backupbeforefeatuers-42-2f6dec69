
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { glSyncApi } from '@/services/glsync';
import { GlideTable, ProductSyncResult } from '@/types/glsync';

export function useGlSync() {
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async (connectionId: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await glSyncApi.testConnection(connectionId);
      return result;
    } catch (error) {
      console.error('Error testing connection:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGlideTables = async (connectionId: string): Promise<{ tables?: GlideTable[]; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await glSyncApi.listGlideTables(connectionId);
      if ('tables' in result) {
        return { tables: result.tables };
      } else {
        return { error: result.error };
      }
    } catch (error) {
      console.error('Error fetching Glide tables:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const syncData = async (connectionId: string, mappingId: string): Promise<ProductSyncResult> => {
    setIsLoading(true);
    try {
      const result = await glSyncApi.syncData(connectionId, mappingId);
      return result;
    } catch (error) {
      console.error('Error syncing data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const retryFailedSync = async (mappingId: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('glsync_retry_failed_sync', { p_mapping_id: mappingId });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error retrying failed sync:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    testConnection,
    fetchGlideTables,
    syncData,
    retryFailedSync,
    isLoading
  };
}
