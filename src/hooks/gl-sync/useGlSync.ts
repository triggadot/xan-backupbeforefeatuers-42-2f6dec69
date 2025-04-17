import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/utils/use-toast';
import { glSyncService } from '@/services/glsync';
import { SyncResult, GlideTable } from '@/types/glide-sync/glsync';
import { createLogger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

// Create a dedicated logger for the GlSync hook
const logger = createLogger('useGlSync');

/**
 * Unified hook for Glide synchronization functionality.
 * This is a thin wrapper around the glsyncService that handles React-specific concerns.
 * 
 * @returns An object containing all Glide sync related operations and state
 */
export function useGlSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [glideTables, setGlideTables] = useState<GlideTable[]>([]);
  const { toast } = useToast();

  /**
   * Tests a connection to Glide
   * @param connectionId The ID of the connection to test
   */
  const testConnection = useCallback(async (connectionId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await glSyncService.testConnection(connectionId);
      
      if (result) {
        toast({
          title: 'Connection Successful',
          description: 'Successfully connected to Glide API.',
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: 'Failed to connect to Glide API. Check your credentials.',
          variant: 'destructive',
        });
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
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
  }, [toast]);

  /**
   * Fetches tables from Glide
   * @param connectionId The ID of the connection to fetch tables for
   */
  const fetchGlideTables = useCallback(async (connectionId: string): Promise<GlideTable[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tables = await glSyncService.listGlideTables(connectionId);
      setGlideTables(tables);
      return tables;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
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
  }, [toast]);

  /**
   * Syncs data between Glide and Supabase
   * @param connectionId The ID of the connection to sync data for
   * @param mappingId The ID of the mapping to use for syncing
   * @param options Additional options for the sync operation
   */
  const syncData = useCallback(async (
    connectionId: string, 
    mappingId: string,
    options: {
      retries?: number,
      showToast?: boolean,
      logLevel?: 'minimal' | 'detailed',
      onProgress?: (progress: number) => void
    } = {}
  ): Promise<SyncResult | null> => {
    const { showToast = true, logLevel = 'detailed', onProgress } = options;
    setIsLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      logger.info(`Starting sync for mapping ${mappingId}`, { 
        data: { connectionId, mappingId, options } 
      });
      
      // Create a sync log entry
      const { data: logData, error: logError } = await supabase
        .from('gl_sync_logs')
        .insert({
          mapping_id: mappingId,
          status: 'started',
          message: 'Sync started',
          started_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (logError) {
        logger.warn(`Error creating sync log: ${logError.message}`);
      }
      
      const result = await glSyncService.syncData(connectionId, mappingId, {
        logLevel,
        onProgress: (value) => {
          setProgress(value);
        }
      });
      
      if (result.success) {
        if (showToast) {
          toast({
            title: 'Sync Completed',
            description: `Successfully synced ${result.recordsProcessed} records.`,
          });
        }
      } else {
        if (showToast) {
          toast({
            title: 'Sync Failed',
            description: result.error || 'Failed to sync data. Check the logs for details.',
            variant: 'destructive',
          });
        }
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Error in syncData:`, { data: err });
      setError(errorMessage);
      
      if (options.showToast) {
        toast({
          title: 'Sync Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [toast]);

  /**
   * Syncs a mapping by ID
   * @param mappingId The ID of the mapping to sync
   * @param options Additional options for the sync operation
   */
  const syncMappingById = useCallback(async (
    mappingId: string,
    options: {
      retries?: number,
      batchSize?: number,
      onProgress?: (progress: number) => void,
      logLevel?: 'minimal' | 'detailed'
    } = {}
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      logger.info(`Syncing mapping by ID: ${mappingId}`, { data: { mappingId, options } });
      
      // Get the mapping details to find the connection ID
      const { data: mapping, error: mappingError } = await supabase
        .from('gl_mappings')
        .select('connection_id')
        .eq('id', mappingId)
        .single();
      
      if (mappingError) {
        throw new Error(`Error fetching mapping: ${mappingError.message}`);
      }
      
      if (!mapping) {
        throw new Error('Mapping not found');
      }
      
      const connectionId = mapping.connection_id;
      
      // Call the syncData method with the connection ID and mapping ID
      const result = await syncData(connectionId, mappingId, {
        retries: options.retries,
        logLevel: options.logLevel
      });
      
      if (result?.success) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Error in syncMappingById:`, { data: err });
      setError(errorMessage);
      
      toast({
        title: 'Sync Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [syncData, toast]);

  /**
   * Retries a failed sync
   * @param logId The ID of the sync log to retry
   */
  const retryFailedSync = useCallback(async (logId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info(`Retrying failed sync: ${logId}`);
      
      // Get the log entry to find the mapping ID
      const { data: log, error: logError } = await supabase
        .from('gl_sync_logs')
        .select('mapping_id')
        .eq('id', logId)
        .single();
      
      if (logError) {
        throw new Error(`Error fetching sync log: ${logError.message}`);
      }
      
      if (!log) {
        throw new Error('Sync log not found');
      }
      
      // Call syncMappingById with the mapping ID from the log
      return await syncMappingById(log.mapping_id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Error in retryFailedSync:`, { data: err });
      setError(errorMessage);
      
      toast({
        title: 'Retry Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [syncMappingById, toast]);

  /**
   * Syncs multiple mappings in sequence
   * @param mappingIds Array of mapping IDs to sync
   * @param options Additional options for the batch sync operation
   */
  const batchSyncMappings = useCallback(async (
    mappingIds: string[],
    options: {
      logLevel?: 'minimal' | 'detailed',
      onProgress?: (progress: number) => void
    } = {}
  ): Promise<{
    success: boolean;
    results: { mappingId: string; success: boolean; error?: string }[];
  }> => {
    const { logLevel = 'minimal', onProgress } = options;
    setIsLoading(true);
    setError(null);
    
    const results: { mappingId: string; success: boolean; error?: string }[] = [];
    let allSuccessful = true;
    
    try {
      logger.info(`Starting batch sync for ${mappingIds.length} mappings`, { 
        data: { mappingIds, options } 
      });
      
      for (let i = 0; i < mappingIds.length; i++) {
        const mappingId = mappingIds[i];
        const progress = (i / mappingIds.length) * 100;
        setProgress(progress);
        
        // Call the provided onProgress callback if available
        if (onProgress) {
          onProgress(progress);
        }
        
        try {
          const success = await syncMappingById(mappingId, {
            logLevel
          });
          
          results.push({ mappingId, success });
          
          if (!success) {
            allSuccessful = false;
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          results.push({ mappingId, success: false, error: errorMessage });
          allSuccessful = false;
        }
      }
      
      setProgress(100);
      
      // Call the provided onProgress callback with 100% when done
      if (onProgress) {
        onProgress(100);
      }
      
      const successCount = results.filter(r => r.success).length;
      
      toast({
        title: allSuccessful ? 'Batch Sync Completed' : 'Batch Sync Completed with Errors',
        description: `Successfully synced ${successCount} of ${mappingIds.length} mappings.`,
        variant: allSuccessful ? 'default' : 'destructive',
      });
      
      return { success: allSuccessful, results };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Error in batchSyncMappings:`, { data: err });
      setError(errorMessage);
      
      toast({
        title: 'Batch Sync Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return { success: false, results };
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [syncMappingById, toast]);

  /**
   * @deprecated This function is deprecated and will be removed in a future version.
   * Relationships are now handled automatically during the sync process using rowid_ fields.
   * 
   * Maps all relationships between tables - this is a stub that returns a deprecation notice
   * @param tableFilter Optional filter for specific tables
   */
  const mapAllRelationships = useCallback(async (tableFilter?: string): Promise<{
    success: boolean;
    result?: any;
    error?: string;
  }> => {
    const deprecationMessage = 'The relationship mapping functionality has been deprecated. Relationships are now handled automatically during the sync process using rowid_ fields that reference glide_row_id values in related tables.';
    
    logger.warn('Deprecated function called: mapAllRelationships', { 
      data: { tableFilter, message: deprecationMessage } 
    });
    
    toast({
      title: 'Deprecated Feature',
      description: deprecationMessage,
      variant: 'destructive',
      duration: 10000,
    });
    
    return { 
      success: false, 
      error: deprecationMessage,
      result: { deprecated: true }
    };
  }, [toast]);

  return {
    // Connection testing
    testConnection,
    
    // Table operations
    fetchGlideTables,
    glideTables,
    // For backward compatibility
    listTables: fetchGlideTables,
    
    // Sync operations
    syncData,
    syncMappingById,
    retryFailedSync,
    batchSyncMappings,
    
    // Relationship mapping (deprecated)
    mapAllRelationships,
    
    // Direct service access for advanced operations
    service: glSyncService,
    
    // Status indicators
    isLoading,
    progress,
    error
  };
}
