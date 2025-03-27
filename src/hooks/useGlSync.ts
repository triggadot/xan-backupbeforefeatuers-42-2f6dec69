
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { GlSyncStatus, SyncRequestPayload, GlideTable, ProductSyncResult } from '@/types/glsync';
import { testConnection, listGlideTables, syncData, mapAllRelationships } from '@/services/glsync';
import { glSyncApi } from '@/services/glSyncApi';

export function useGlSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [glideTables, setGlideTables] = useState<GlideTable[]>([]);
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

  const getTables = async (connectionId: string): Promise<any[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tables = await listGlideTables(connectionId);
      if (!tables || tables.length === 0) {
        setError('No tables found');
        toast({
          title: 'No Tables Found',
          description: 'No tables were found in the Glide application.',
          variant: 'destructive',
        });
      }
      return tables || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching tables';
      setError(errorMessage);
      toast({
        title: 'Error Fetching Tables',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const syncMapping = async (connectionId: string, mappingId: string): Promise<ProductSyncResult | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await syncData(connectionId, mappingId);
      if (!result) {
        setError('Sync failed');
        toast({
          title: 'Sync Failed',
          description: 'Failed to synchronize data.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Sync Successful',
          description: 'Data synchronized successfully.',
        });
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during sync';
      setError(errorMessage);
      toast({
        title: 'Sync Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Add the new mapAllRelationships function
  const mapRelationships = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await mapAllRelationships();
      if (!success) {
        setError('Relationship mapping failed');
        toast({
          title: 'Mapping Failed',
          description: 'Failed to map relationships between tables.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Mapping Successful',
          description: 'Relationships mapped successfully.',
        });
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during relationship mapping';
      setError(errorMessage);
      toast({
        title: 'Mapping Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGlideTables = async (connectionId: string) => {
    setIsLoading(true);
    try {
      const response = await glSyncApi.listGlideTables(connectionId);
      if (response.success && response.tables) {
        setGlideTables(response.tables);
        return { tables: response.tables };
      } else {
        setError(response.error || 'Failed to fetch tables');
        return { error: response.error || 'Failed to fetch tables' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const retryFailedSync = async (connectionId: string, mappingId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await glSyncApi.retryFailedSync(connectionId, mappingId);
      if (!result) {
        setError('Retry failed');
        toast({
          title: 'Retry Failed',
          description: 'Failed to retry the sync operation.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Retry Successful',
          description: 'Sync operation retried successfully.',
        });
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during retry';
      setError(errorMessage);
      toast({
        title: 'Retry Error',
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
    listTables: getTables,
    syncData: syncMapping,
    mapAllRelationships: mapRelationships,
    fetchGlideTables,
    glideTables,
    retryFailedSync,
    isLoading,
    error
  };
}
