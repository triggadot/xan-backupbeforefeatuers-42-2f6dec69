import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { GlSyncStatus, SyncRequestPayload, GlideTable, ProductSyncResult } from '@/types/glsync';
import { testConnection, listGlideTables, syncData, mapAllRelationships, validateRelationships } from '@/services/glsync';
import { glSyncApi } from '@/services/glSyncApi';
import { supabase } from '@/integrations/supabase/client';

export function useGlSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRelationshipMapping, setIsRelationshipMapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [glideTables, setGlideTables] = useState<GlideTable[]>([]);
  const [relationshipStatus, setRelationshipStatus] = useState<{
    tables: string[];
    pendingCount: number;
    mappedCount: number;
  } | null>(null);
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

  const syncMappingById = async (mappingId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'syncMapping',
          mappingId: mappingId
        }
      });
      
      if (error) {
        setError(`Sync failed: ${error.message}`);
        toast({
          title: 'Sync Failed',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }
      
      if (!data?.success) {
        const errorMessage = data?.error || 'Unknown error during sync';
        setError(errorMessage);
        toast({
          title: 'Sync Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      }
      
      toast({
        title: 'Sync Successful',
        description: 'Data synchronized successfully.',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during sync';
      setError(errorMessage);
      toast({
        title: 'Sync Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const checkRelationshipStatus = useCallback(async (): Promise<void> => {
    try {
      // Get pending relationships count
      const { data: pendingResult, error: pendingError } = await supabase
        .from('gl_relationship_mapping_log')
        .select('count')
        .eq('status', 'pending');
      
      if (pendingError) throw pendingError;
      
      // Get mapped relationships count
      const { data: mappedResult, error: mappedError } = await supabase
        .from('gl_relationship_mapping_log')
        .select('count')
        .eq('status', 'completed');
        
      if (mappedError) throw mappedError;
      
      // Safely extract counts
      const pendingCount = pendingResult && pendingResult.length > 0 ? (pendingResult[0]?.count ?? 0) : 0;
      const mappedCount = mappedResult && mappedResult.length > 0 ? (mappedResult[0]?.count ?? 0) : 0;
      
      // Validate which tables have data
      const validation = await validateRelationships();
      
      setRelationshipStatus({
        tables: validation.validTables,
        pendingCount,
        mappedCount
      });
      
    } catch (error) {
      console.error('Error checking relationship status:', error);
    }
  }, []);

  const mapRelationships = async (tableFilter?: string): Promise<{
    success: boolean;
    result?: any;
    error?: string;
  }> => {
    setIsRelationshipMapping(true);
    setError(null);
    
    try {
      await checkRelationshipStatus();
      
      const result = await mapAllRelationships({ tableFilter });
      
      if (!result.success) {
        setError('Relationship mapping failed: ' + result.error);
        toast({
          title: 'Mapping Failed',
          description: 'Failed to map relationships between tables: ' + result.error,
          variant: 'destructive',
        });
        return result;
      } else {
        toast({
          title: 'Mapping Successful',
          description: 'Relationships mapped successfully.',
        });
        console.log('Mapping result:', result.result);
        await checkRelationshipStatus();
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during relationship mapping';
      setError(errorMessage);
      toast({
        title: 'Mapping Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsRelationshipMapping(false);
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
    syncMappingById,
    mapAllRelationships: mapRelationships,
    fetchGlideTables,
    glideTables,
    retryFailedSync,
    checkRelationshipStatus,
    relationshipStatus,
    isLoading,
    isRelationshipMapping,
    error
  };
}
