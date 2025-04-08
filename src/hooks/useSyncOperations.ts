import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SyncResult } from '@/types/glsync';
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/utils/logger';
import { createDetailedSyncLog } from '@/components/sync/utils/syncUtils';

// Create a dedicated logger for sync operations
const logger = createLogger('SyncOperations');

/**
 * Hook for handling sync operations with optimized performance
 * 
 * @returns Object containing sync operations and state
 */
export function useSyncOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const { toast } = useToast();

  /**
   * Syncs data between Glide and Supabase using a specific mapping
   * 
   * @param connectionId - The connection ID (can be empty for syncMapping action)
   * @param mappingId - The mapping ID to sync
   * @param options - Optional configuration parameters
   * @returns Promise resolving to sync result or null
   */
  const syncData = useCallback(async (
    connectionId: string, 
    mappingId: string,
    options: {
      retries?: number,
      showToast?: boolean,
      logLevel?: 'minimal' | 'detailed'
    } = {}
  ): Promise<SyncResult | null> => {
    const { retries = 2, showToast = true, logLevel = 'detailed' } = options;
    setIsLoading(true);
    setError(null);
    
    logger.info(`Starting sync operation for mapping ${mappingId}`, {
      data: { connectionId, mappingId, options }
    });
    
    try {
      // Determine which action to use based on parameters
      const action = connectionId ? 'syncData' : 'syncMapping';
      logger.debug(`Using action: ${action}`);
      
      // Get the connection ID if not provided
      let finalConnectionId = connectionId;
      
      // For syncMapping action, we need to get the connection ID from the database
      if (action === 'syncMapping' && !connectionId) {
        try {
          logger.debug(`Fetching connection ID for mapping ${mappingId}`);
          
          // Query the database to get the connection ID for this mapping
          const { data: mappingData, error: mappingError } = await supabase
            .from('gl_mappings')
            .select('connection_id')
            .eq('id', mappingId)
            .maybeSingle();
          
          if (mappingError) {
            logger.warn(`Error fetching mapping data: ${mappingError.message}`, {
              data: mappingError
            });
          }
            
          if (mappingData?.connection_id) {
            finalConnectionId = mappingData.connection_id;
            logger.debug(`Retrieved connection ID: ${finalConnectionId}`);
            
            // Fetch additional mapping details for logging if detailed logging is enabled
            if (logLevel === 'detailed') {
              try {
                // Use a more explicit approach to fetch mapping details
                const { data, error } = await supabase
                  .from('gl_mappings')
                  .select('*')
                  .eq('id', mappingId)
                  .maybeSingle();
                  
                if (error) {
                  logger.warn(`Error fetching mapping details: ${error.message}`, {
                    data: error
                  });
                } else if (data) {
                  // Check if the data has the expected properties
                  const hasRequiredProps = 
                    typeof data === 'object' && 
                    data !== null &&
                    'name' in data &&
                    'glide_table' in data &&
                    'supabase_table' in data;
                    
                  if (hasRequiredProps) {
                    logger.info(`Sync details:`, {
                      data: {
                        mappingName: String(data.name || 'Unknown'),
                        glideTable: String(data.glide_table || 'Unknown'),
                        supabaseTable: String(data.supabase_table || 'Unknown')
                      }
                    });
                  } else {
                    logger.warn(`Mapping details missing expected properties`, {
                      data: { availableProps: Object.keys(data) }
                    });
                  }
                } else {
                  logger.debug(`No additional mapping details found for ${mappingId}`);
                }
              } catch (detailErr) {
                logger.warn(`Could not fetch mapping details`, { data: detailErr });
              }
            }
          } else {
            logger.warn(`No connection ID found for mapping ${mappingId}`);
          }
        } catch (err) {
          logger.warn(`Could not fetch connection ID for mapping:`, { data: err });
          // Continue with empty connection ID
        }
      }
      
      // Prepare the request body based on the action
      const requestBody: Record<string, any> = {
        action: action,
        mappingId: mappingId,
        connectionId: finalConnectionId || '',
        logLevel: logLevel
      };
      
      logger.info(`Invoking edge function with parameters:`, {
        data: requestBody
      });
      
      // Call the edge function with the appropriate action and parameters
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: requestBody
      });
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (error) {
        logger.error(`Edge function error after ${duration}ms:`, { data: error });
        throw error;
      }
      
      logger.info(`Edge function completed in ${duration}ms`, {
        data: {
          success: data?.success,
          recordsProcessed: data?.recordsProcessed,
          hasError: !!data?.error
        }
      });
      
      if (!data?.success) {
        logger.error(`Sync failed with error: ${data?.error || 'Unknown error'}`, {
          data: data
        });
        throw new Error(data?.error || 'Unknown error during sync');
      }
      
      // Add syncTime to the result if not already present
      if (data && !data.syncTime) {
        data.syncTime = duration;
      }
      
      // Detailed field-level logging for gl_estimate_lines table
      // Check if this is a gl_estimate_lines mapping
      const { data: mappingData, error: mappingError } = await supabase
        .from('gl_mappings')
        .select('supabase_table, glide_table')
        .eq('id', mappingId)
        .maybeSingle();
        
      if (mappingError) {
        logger.warn(`Error fetching mapping data: ${mappingError.message}`, {
          data: mappingError
        });
      }
      
      // Check if this is a gl_estimate_lines mapping
      if (mappingData?.supabase_table === 'gl_estimate_lines') {
        // Create a detailed log entry with field-level information
        try {
          // Get a sample of the data that was synced
          const { data: sampleData, error: sampleError } = await supabase
            .from('gl_estimate_lines')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (sampleError) {
            logger.warn('Error fetching sample data for gl_estimate_lines:', sampleError);
          }
          
          // Extract field names from the sample data
          const syncedFields = sampleData && sampleData.length > 0 
            ? Object.keys(sampleData[0]).filter(key => 
                key !== 'id' && 
                key !== 'created_at' && 
                key !== 'updated_at'
              )
            : [];
          
          // Check if only rowid fields are being synced
          const hasOnlyRowidFields = syncedFields.every(field => field.startsWith('rowid_') || field === 'glide_row_id');
          
          if (hasOnlyRowidFields) {
            logger.warn('Only rowid fields are being synced for gl_estimate_lines. This indicates a potential issue with the sync process.', {
              data: { syncedFields }
            });
            
            // Verify the expected fields based on the EstimateLineData interface
            const expectedFields = [
              'glide_row_id',
              'rowid_estimates',
              'rowid_products',
              'sale_product_name',
              'qty_sold',
              'selling_price',
              'product_sale_note',
              'date_of_sale'
            ];
            
            // Log the missing fields
            const missingFields = expectedFields.filter(field => !syncedFields.includes(field));
            
            if (missingFields.length > 0) {
              logger.error('Missing fields in gl_estimate_lines sync:', {
                data: { missingFields }
              });
            }
          }
            
          await createDetailedSyncLog(
            mappingId,
            'completed',
            {
              message: hasOnlyRowidFields 
                ? `Warning: Only rowid fields were synced for gl_estimate_lines table` 
                : `Sync completed for gl_estimate_lines table`,
              recordsProcessed: data.recordsProcessed || 0,
              syncedFields,
              syncDuration: data.syncTime,
              recordDetails: {
                table: 'gl_estimate_lines',
                inserted: data.inserted || 0,
                updated: data.updated || 0,
                failed: data.failed || 0,
                sampleData: sampleData && sampleData.length > 0 ? sampleData[0] : null
              }
            }
          );
          
          logger.info('Created detailed sync log for gl_estimate_lines', {
            data: { syncedFields, recordsProcessed: data.recordsProcessed }
          });
        } catch (logError) {
          logger.error('Error creating detailed sync log:', logError);
        }
      }
      
      if (showToast) {
        toast({
          title: 'Sync Successful',
          description: `Processed ${data?.recordsProcessed || 0} records in ${duration}ms.`,
        });
      }
      
      return data as SyncResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during sync';
      logger.error(`Sync failed: ${errorMessage}`, { data: err });
      setError(errorMessage);
      
      if (showToast) {
        toast({
          title: 'Sync Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      return null;
    } finally {
      setIsLoading(false);
      logger.debug(`Sync operation completed for mapping ${mappingId}`);
    }
  }, [toast]);

  /**
   * Syncs a mapping by ID using the edge function
   * This is the primary method for syncing individual mappings
   * 
   * @param mappingId - The mapping ID to sync
   * @param options - Optional parameters
   * @returns Promise resolving to success status
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
    const { onProgress, logLevel = 'detailed' } = options;
    setProgress(0);
    
    logger.info(`Starting syncMappingById for mapping ${mappingId}`);
    
    try {
      // Add request caching to prevent duplicate requests
      const cacheKey = `sync-${mappingId}-${Date.now()}`;
      sessionStorage.setItem(cacheKey, 'pending');
      logger.debug(`Created cache key: ${cacheKey}`);
      
      // Pass empty string for connectionId to use 'syncMapping' action
      const result = await syncData('', mappingId, { 
        showToast: false,
        logLevel
      });
      
      // Clear cache
      sessionStorage.removeItem(cacheKey);
      logger.debug(`Removed cache key: ${cacheKey}`);
      
      // Update progress
      setProgress(100);
      if (onProgress) onProgress(100);
      
      if (result) {
        logger.info(`Sync successful for mapping ${mappingId}`, {
          data: {
            recordsProcessed: result.recordsProcessed,
            syncTime: result.syncTime
          }
        });
        
        toast({
          title: 'Sync Successful',
          description: `Processed ${result.recordsProcessed || 0} records in ${result.syncTime || 0}ms.`,
        });
      } else {
        logger.warn(`Sync returned null result for mapping ${mappingId}`);
        throw new Error('Sync operation returned no result');
      }
      
      return result !== null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during sync';
      logger.error(`syncMappingById failed: ${errorMessage}`, { data: err });
      setError(errorMessage);
      toast({
        title: 'Sync Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  }, [syncData, toast]);

  /**
   * Batch syncs multiple mappings
   * 
   * @param mappingIds - Array of mapping IDs to sync
   * @returns Promise resolving to array of results
   */
  const batchSyncMappings = useCallback(async (
    mappingIds: string[]
  ): Promise<{success: boolean, mappingId: string, error?: string}[]> => {
    if (!mappingIds.length) return [];
    
    logger.info(`Starting batch sync for ${mappingIds.length} mappings`, {
      data: { mappingIds }
    });
    
    setIsLoading(true);
    setError(null);
    setProgress(0);
    
    const results: {success: boolean, mappingId: string, error?: string}[] = [];
    const totalMappings = mappingIds.length;
    
    for (let i = 0; i < totalMappings; i++) {
      const mappingId = mappingIds[i];
      try {
        // Update progress
        const currentProgress = Math.round(((i) / totalMappings) * 100);
        setProgress(currentProgress);
        logger.debug(`Processing mapping ${i+1}/${totalMappings}: ${mappingId}`);
        
        // Use minimal logging for batch operations to reduce noise
        const success = await syncMappingById(mappingId, { logLevel: 'minimal' });
        results.push({ success, mappingId });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.error(`Error syncing mapping ${mappingId}: ${errorMessage}`, { data: err });
        results.push({ success: false, mappingId, error: errorMessage });
      }
      
      // Update progress after each mapping
      const newProgress = Math.round(((i + 1) / totalMappings) * 100);
      setProgress(newProgress);
    }
    
    setIsLoading(false);
    
    // Show summary toast
    const successCount = results.filter(r => r.success).length;
    logger.info(`Batch sync completed: ${successCount}/${totalMappings} successful`, {
      data: results
    });
    
    toast({
      title: 'Batch Sync Complete',
      description: `Successfully synced ${successCount} of ${totalMappings} mappings.`,
      variant: successCount === totalMappings ? 'default' : 'destructive',
    });
    
    return results;
  }, [syncMappingById, toast]);

  /**
   * Retries a failed sync operation
   * 
   * @param connectionId - The connection ID
   * @param mappingId - The mapping ID
   * @returns Promise resolving to success status
   */
  const retryFailedSync = useCallback(async (
    connectionId: string, 
    mappingId: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    logger.info(`Retrying failed sync for mapping ${mappingId}`, {
      data: { connectionId, mappingId }
    });
    
    try {
      // Use the direct syncData method with retry parameters
      const result = await syncData(connectionId, mappingId, {
        retries: 3,
        showToast: false,
        logLevel: 'detailed'
      });
      
      const success = result !== null;
      
      if (!success) {
        setError('Retry failed');
        logger.error(`Retry failed for mapping ${mappingId}`);
        toast({
          title: 'Retry Failed',
          description: 'Failed to retry the sync operation.',
          variant: 'destructive',
        });
      } else {
        logger.info(`Retry successful for mapping ${mappingId}`, {
          data: {
            recordsProcessed: result?.recordsProcessed,
            syncTime: result?.syncTime
          }
        });
        toast({
          title: 'Retry Successful',
          description: `Processed ${result?.recordsProcessed || 0} records in ${result?.syncTime || 0}ms.`,
        });
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during retry';
      logger.error(`Retry error: ${errorMessage}`, { data: err });
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
  }, [syncData, toast]);

  return {
    syncData,
    syncMappingById,
    batchSyncMappings,
    retryFailedSync,
    isLoading,
    progress,
    error
  };
}
