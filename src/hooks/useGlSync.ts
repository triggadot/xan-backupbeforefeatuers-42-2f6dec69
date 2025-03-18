
import { useState } from 'react';
import { glSyncApi } from '@/services/glsync';
import { GlideTable } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';

export function useGlSync() {
  const [glideTables, setGlideTables] = useState<GlideTable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchGlideTables = async (connectionId: string): Promise<GlideTable[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await glSyncApi.listGlideTables(connectionId);
      
      if ('tables' in response) {
        setGlideTables(response.tables);
        return response.tables;
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred fetching Glide tables';
      setError(message);
      console.error('Error fetching Glide tables:', err);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGlideTableColumns = async (connectionId: string, tableId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await glSyncApi.getGlideTableColumns(connectionId, tableId);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred fetching table columns';
      setError(message);
      console.error('Error fetching table columns:', err);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return { error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (connectionId: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await glSyncApi.testConnection(connectionId);
      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast({
        title: 'Connection Test',
        description: 'Connection test successful!',
      });
      
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection test failed';
      setError(message);
      console.error('Connection test error:', err);
      toast({
        title: 'Connection Error',
        description: message,
        variant: 'destructive',
      });
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    glideTables,
    isLoading,
    error,
    fetchGlideTables,
    fetchGlideTableColumns,
    testConnection
  };
}
