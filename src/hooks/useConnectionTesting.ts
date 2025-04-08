
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { testConnection } from '@/services/glsync';

export function useConnectionTesting() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const testGlideConnection = async (connectionId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await testConnection(connectionId);
      if (!success) {
        setError('Connection test failed');
        toast({
          title: 'Connection Failed',
          description: 'Could not connect to Glide with the provided credentials.',
          variant: 'destructive',
        });
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error testing connection';
      setError(errorMessage);
      toast({
        title: 'Connection Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    testConnection: testGlideConnection,
    isLoading,
    error
  };
}
