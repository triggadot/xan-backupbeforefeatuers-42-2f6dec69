
import { supabase } from '@/integrations/supabase/client';
import { GlColumnMapping, ProductSyncResult } from '@/types/glsync';

export abstract class BaseSyncService {
  protected readonly mappingId: string;
  protected readonly connectionId: string;
  
  constructor(connectionId: string, mappingId: string) {
    this.connectionId = connectionId;
    this.mappingId = mappingId;
  }

  protected async recordSyncError(
    errorType: string, 
    errorMessage: string, 
    recordData?: any,
    retryable: boolean = false
  ): Promise<void> {
    try {
      await supabase.rpc('gl_record_sync_error', {
        p_mapping_id: this.mappingId,
        p_error_type: errorType,
        p_error_message: errorMessage,
        p_record_data: recordData,
        p_retryable: retryable
      });
    } catch (error) {
      console.error('Error recording sync error:', error);
    }
  }

  protected validateColumnMappings(
    record: Record<string, any>,
    columnMappings: Record<string, GlColumnMapping>
  ): boolean {
    // Basic validation of required fields
    if (!record.glide_row_id) {
      this.recordSyncError(
        'VALIDATION_ERROR',
        'Missing required glide_row_id',
        { record }
      );
      return false;
    }

    return true;
  }

  protected async updateSyncLog(
    logId: string,
    status: string,
    message: string,
    recordsProcessed?: number
  ): Promise<void> {
    const updateData: any = {
      status,
      message,
    };
    
    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }
    
    if (recordsProcessed !== undefined) {
      updateData.records_processed = recordsProcessed;
    }

    await supabase
      .from('gl_sync_logs')
      .update(updateData)
      .eq('id', logId);
  }

  abstract sync(): Promise<ProductSyncResult>;
}
