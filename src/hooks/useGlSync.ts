
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { glSyncApi } from '@/services/glsync';
import { supabase } from '@/integrations/supabase/client';
import { GlideTable, ProductSyncResult } from '@/types/glsync';

export function useGlSync() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [glideTables, setGlideTables] = useState<GlideTable[]>([]);

  const fetchGlideTables = useCallback(async (connectionId: string): Promise<{tables?: GlideTable[], error?: string}> => {
    try {
      setIsLoading(true);
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
      
      console.log('Fetched Glide tables:', result.tables);
      setGlideTables(result.tables);
      return { tables: result.tables };
    } catch (error) {
      console.error('Error fetching Glide tables:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch Glide tables',
        variant: 'destructive',
      });
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Enhanced syncData function that supports both direct API calls and supabase function calls
  const syncData = useCallback(async (connectionId: string, mappingId: string, useDirect: boolean = true): Promise<ProductSyncResult> => {
    setIsLoading(true);
    setError(null);

    try {
      let result;
      
      if (useDirect) {
        // Use the direct API method from glSyncApi
        result = await glSyncApi.syncData(connectionId, mappingId);
      } else {
        // Use the Supabase function invocation directly (previously in useSyncData)
        const { data, error: invokeError } = await supabase.functions.invoke('glsync', {
          body: {
            action: 'syncData',
            connectionId,
            mappingId,
          },
        });
        
        if (invokeError) throw new Error(invokeError.message);
        result = data as ProductSyncResult;
      }
      
      // After sync, explicitly call the relationship mapping function
      try {
        const { data: mapResult, error: mapError } = await supabase.functions.invoke('glsync', {
          body: {
            action: 'mapRelationships',
            mappingId,
          },
        });
        
        if (mapError) {
          console.warn('Warning: Relationship mapping had errors:', mapError);
        } else {
          console.log('Relationship mapping result:', mapResult);
        }
      } catch (mapError) {
        console.warn('Warning: Failed to map relationships:', mapError);
        // Don't fail the sync if relationship mapping fails
      }
      
      if (!result.success) {
        const errorMessage = result.error || 'An unknown error occurred during sync';
        setError(errorMessage);
        toast({
          title: 'Sync Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }

      return {
        success: result.success,
        error: result.error,
        recordsProcessed: result.recordsProcessed || result.processed_records || 0,
        failedRecords: result.failedRecords || result.failed_records || 0
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during sync';
      setError(message);
      toast({
        title: 'Sync Error',
        description: message,
        variant: 'destructive',
      });
      return {
        success: false,
        error: message,
        recordsProcessed: 0,
        failedRecords: 0
      };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const retryFailedSync = useCallback(async (connectionId: string, mappingId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await glSyncApi.callSyncFunction({
        action: "syncData",
        connectionId,
        mappingId,
      });

      if (error) throw new Error(error.message);
      
      // After retry, explicitly call the relationship mapping function
      try {
        const { data: mapResult, error: mapError } = await supabase.functions.invoke('glsync', {
          body: {
            action: 'mapRelationships',
            mappingId,
          },
        });
        
        if (mapError) {
          console.warn('Warning: Relationship mapping had errors:', mapError);
        } else {
          console.log('Relationship mapping result:', mapResult);
        }
      } catch (mapError) {
        console.warn('Warning: Failed to map relationships:', mapError);
        // Don't fail the retry if relationship mapping fails
      }
      
      toast({
        title: 'Retry initiated',
        description: 'Retry of failed synchronization has been initiated.',
      });
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during retry';
      setError(message);
      toast({
        title: 'Retry Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // New function to explicitly map relationships for a mapping
  const mapRelationships = useCallback(async (mappingId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'mapRelationships',
          mappingId,
        },
      });

      if (error) throw new Error(error.message);
      
      toast({
        title: 'Relationships Mapped',
        description: 'Relationships have been mapped successfully.',
      });
      
      console.log('Relationship mapping result:', data);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during relationship mapping';
      setError(message);
      toast({
        title: 'Mapping Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Function to map relationships across all tables
  const mapAllRelationships = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await glSyncApi.mapAllRelationships();
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to map relationships');
      }

      toast({
        title: 'Relationships Mapped',
        description: `Successfully mapped ${response.result?.total_mapped || 0} relationships across all tables.`,
      });
      
      console.log('All relationships mapping result:', response.result);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred while mapping relationships';
      setError(message);
      toast({
        title: 'Mapping Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    isLoading,
    glideTables,
    fetchGlideTables,
    syncData,
    retryFailedSync,
    mapRelationships,
    mapAllRelationships,
    error
  };
}
