import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { glSyncApi } from '@/services/glsync';

export function useGlSync() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const fetchGlideTables = async (connectionId: string) => {
    try {
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
      
      return { tables: result.tables };
    } catch (error) {
      console.error('Error fetching Glide tables:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch Glide tables',
        variant: 'destructive',
      });
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  return {
    isLoading,
    fetchGlideTables,
  };
}
