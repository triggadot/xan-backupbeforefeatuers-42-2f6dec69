
import { supabase } from "@/integrations/supabase/client";
import { ProductSyncResult } from "@/types/glsync";

/**
 * Syncs products from Glide to Supabase
 */
export async function syncProducts(mappingId: string): Promise<ProductSyncResult> {
  try {
    console.log(`Starting product sync for mapping: ${mappingId}`);
    
    // Call the glsync edge function
    const { data, error } = await supabase.functions.invoke('glsync', {
      body: {
        action: 'syncProducts',
        mappingId
      }
    });
    
    if (error) {
      console.error('Error in syncProducts function:', error);
      return {
        success: false,
        error: error.message || 'An error occurred during product sync',
        recordsProcessed: 0,
        failedRecords: 0
      };
    }
    
    // Check for errors in the response data
    if (data && !data.success) {
      console.error('Error in sync products response:', data.error);
      return {
        success: false,
        error: data.error || 'An error occurred during product sync',
        recordsProcessed: data.recordsProcessed || 0,
        failedRecords: data.failedRecords || 0
      };
    }
    
    return {
      success: true,
      recordsProcessed: data.recordsProcessed || 0,
      failedRecords: data.failedRecords || 0
    };
  } catch (error) {
    console.error('Exception in syncProducts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during product sync',
      recordsProcessed: 0,
      failedRecords: 0
    };
  }
}
