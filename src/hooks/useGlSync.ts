
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProductSyncResult } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';

export function useGlSync() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const syncData = async (connectionId: string, mappingId: string): Promise<ProductSyncResult> => {
    setIsLoading(true);
    
    try {
      console.log('Syncing data for mapping:', mappingId);
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'syncData',
          connectionId,
          mappingId,
        },
      });

      if (error) throw error;
      
      if (data.success) {
        toast({
          title: 'Sync completed',
          description: `Processed ${data.processed_records || 0} records successfully`,
        });
      } else {
        toast({
          title: 'Sync completed with issues',
          description: `Failed records: ${data.failed_records || 0}`,
          variant: 'destructive',
        });
      }
      
      return data;
    } catch (error: any) {
      console.error('Error syncing data:', error);
      toast({
        title: 'Sync failed',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
      return {
        success: false,
        error: error.message,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (connectionId: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'testConnection',
          connectionId,
        },
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error testing connection:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGlideTables = async (connectionId: string): Promise<{ tables?: any[]; error?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'listGlideTables',
          connectionId,
        },
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching Glide tables:', error);
      return {
        error: error.message || 'Unknown error',
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    syncData,
    testConnection,
    fetchGlideTables,
    isLoading
  };
}
