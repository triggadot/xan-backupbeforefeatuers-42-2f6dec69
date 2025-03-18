
import { supabase } from '@/integrations/supabase/client';
import { GlProduct, ProductSyncResult } from '@/types/glsync';
import { BaseSyncService } from './base-sync';
import { transformGlideToSupabase } from '@/utils/glsync-transformers';

export class ProductsSyncService extends BaseSyncService {
  async sync(): Promise<ProductSyncResult> {
    let totalRecordsProcessed = 0;
    let totalFailedRecords = 0;
    
    try {
      // Create sync log entry
      const { data: logData, error: logError } = await supabase
        .from('gl_sync_logs')
        .insert({
          mapping_id: this.mappingId,
          status: 'started',
          message: 'Starting products sync'
        })
        .select('id')
        .single();

      if (logError) throw new Error(`Failed to create sync log: ${logError.message}`);
      const logId = logData.id;

      // Call edge function to sync data
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'syncData',
          connectionId: this.connectionId,
          mappingId: this.mappingId,
        },
      });

      if (error) throw new Error(error.message);

      // Update sync results
      await this.updateSyncLog(
        logId,
        data.success ? 'completed' : 'failed',
        data.success ? 'Sync completed successfully' : 'Sync encountered issues',
        data.recordsProcessed
      );

      return data as ProductSyncResult;
    } catch (error) {
      console.error('Error in products sync:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        recordsProcessed: totalRecordsProcessed,
        failedRecords: totalFailedRecords
      };
    }
  }
}
