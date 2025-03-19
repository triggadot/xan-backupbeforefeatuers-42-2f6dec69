
import { GlMapping, GlColumnMapping } from '@/types/glsync';

/**
 * Converts a database record to a GlMapping object
 */
export function convertToGlMapping(record: any): GlMapping {
  // Ensure column_mappings is an object
  let columnMappings: Record<string, GlColumnMapping> = {};
  
  // Handle different formats: string, object, or null
  if (record.column_mappings) {
    if (typeof record.column_mappings === 'string') {
      try {
        columnMappings = JSON.parse(record.column_mappings);
      } catch (e) {
        console.error('Failed to parse column_mappings:', e);
      }
    } else if (typeof record.column_mappings === 'object') {
      columnMappings = record.column_mappings;
    }
  }
  
  // Ensure sync_direction is one of the valid types
  const validDirections = ['to_supabase', 'to_glide', 'both'];
  let syncDirection = record.sync_direction || 'to_supabase';
  if (!validDirections.includes(syncDirection)) {
    console.warn(`Invalid sync_direction: ${syncDirection}, defaulting to to_supabase`);
    syncDirection = 'to_supabase';
  }
  
  return {
    id: record.id,
    connection_id: record.connection_id,
    glide_table: record.glide_table,
    glide_table_display_name: record.glide_table_display_name || record.glide_table,
    supabase_table: record.supabase_table,
    column_mappings: columnMappings,
    sync_direction: syncDirection as 'to_supabase' | 'to_glide' | 'both',
    enabled: record.enabled !== false, // Default to true if not specified
    created_at: record.created_at,
    updated_at: record.updated_at,
    
    // Optional metrics fields
    current_status: record.current_status,
    last_sync_started_at: record.last_sync_started_at,
    last_sync_completed_at: record.last_sync_completed_at,
    records_processed: record.records_processed,
    total_records: record.total_records,
    error_count: record.error_count,
    app_name: record.app_name
  };
}

/**
 * Returns default column mappings for a new mapping
 */
export function getDefaultColumnMappings(): Record<string, GlColumnMapping> {
  return {
    "$rowID": {
      "glide_column_name": "$rowID",
      "supabase_column_name": "glide_row_id",
      "data_type": "string"
    }
  };
}
