
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { GlideTable } from '@/types/glsync';
import { glSyncApi } from '@/services/glSyncApi';

export function useGlideTables() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [glideTables, setGlideTables] = useState<GlideTable[]>([]);
  const { toast } = useToast();

  const fetchGlideTables = async (connectionId: string) => {
    setIsLoading(true);
    try {
      const response = await glSyncApi.listGlideTables(connectionId);
      if (response.success && response.tables) {
        setGlideTables(response.tables);
        return { tables: response.tables };
      } else {
        setError(response.error || 'Failed to fetch tables');
        toast({
          title: 'Error Fetching Tables',
          description: response.error || 'Failed to fetch tables',
          variant: 'destructive',
        });
        return { error: response.error || 'Failed to fetch tables' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error Fetching Tables',
        description: errorMessage,
        variant: 'destructive',
      });
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchGlideTables,
    glideTables,
    isLoading,
    error
  };
}
