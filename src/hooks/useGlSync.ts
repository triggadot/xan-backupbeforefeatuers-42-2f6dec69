
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ProductSyncResult } from '@/types/glsync';
import { ProductsSyncService } from '@/services/sync/products-sync';
import { validateMapping } from '@/utils/gl-mapping-validator';

export function useGlSync() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<ProductSyncResult | null>(null);
  const { toast } = useToast();

  const syncData = async (connectionId: string, mappingId: string) => {
    setIsLoading(true);
    setSyncResult(null);
    
    try {
      // First validate the mapping
      const validationResult = await validateMapping(mappingId);
      
      if (!validationResult.is_valid) {
        throw new Error(`Mapping validation failed: ${validationResult.validation_message}`);
      }
      
      // Initialize the appropriate sync service
      const syncService = new ProductsSyncService(connectionId, mappingId);
      
      // Perform the sync operation
      const result = await syncService.sync();
      
      setSyncResult(result);
      
      if (result.success) {
        toast({
          title: 'Sync completed',
          description: `Successfully processed ${result.recordsProcessed || 0} records`,
        });
      } else {
        toast({
          title: 'Sync had issues',
          description: result.error || `Processed ${result.recordsProcessed || 0} records with ${result.failedRecords || 0} failures`,
          variant: 'destructive',
        });
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSyncResult({ 
        success: false, 
        error: errorMessage,
        recordsProcessed: 0,
        failedRecords: 0
      });
      
      toast({
        title: 'Sync failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    syncData,
    isLoading,
    syncResult
  };
}
