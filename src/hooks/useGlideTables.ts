import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { GlideTable } from '@/types/glsync';
import { glSyncService } from '@/services/glsync';

/**
 * Hook for fetching and managing Glide tables
 * 
 * @returns Object containing functions and state for Glide tables
 */
export function useGlideTables() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [glideTables, setGlideTables] = useState<GlideTable[]>([]);
  const { toast } = useToast();

  /**
   * Fetches tables from Glide for a specific connection
   * 
   * @param connectionId - The ID of the connection to fetch tables for
   * @returns Object containing tables or error information
   */
  const fetchGlideTables = async (connectionId: string) => {
    setIsLoading(true);
    try {
      const tables = await glSyncService.listGlideTables(connectionId);
      
      if (tables && tables.length > 0) {
        setGlideTables(tables);
        return { success: true, tables };
      } else {
        const errorMessage = 'No tables found or error occurred';
        setError(errorMessage);
        toast({
          title: 'Error Fetching Tables',
          description: errorMessage,
          variant: 'destructive',
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error Fetching Tables',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
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
