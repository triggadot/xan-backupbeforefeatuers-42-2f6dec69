
import { GlMapping, GlColumnMapping } from '@/types/glsync';
import { Mapping } from '@/types/syncLog';

/**
 * Converts a raw database mapping to a properly typed GlMapping
 */
export function convertToGlMapping(mapping: Mapping | any): GlMapping {
  // Handle the column_mappings being a string
  let columnMappings: Record<string, GlColumnMapping> = {};
  
  if (typeof mapping.column_mappings === 'string') {
    try {
      columnMappings = JSON.parse(mapping.column_mappings);
    } catch (e) {
      console.error('Failed to parse column_mappings string:', e);
      columnMappings = {};
    }
  } else if (typeof mapping.column_mappings === 'object') {
    columnMappings = mapping.column_mappings;
  }
  
  return {
    id: mapping.id,
    connection_id: mapping.connection_id,
    glide_table: mapping.glide_table,
    glide_table_display_name: mapping.glide_table_display_name,
    supabase_table: mapping.supabase_table,
    column_mappings: columnMappings,
    sync_direction: mapping.sync_direction,
    enabled: mapping.enabled,
    created_at: mapping.created_at,
    updated_at: mapping.updated_at,
    
    // Optional metrics fields
    current_status: mapping.current_status,
    last_sync_started_at: mapping.last_sync_started_at,
    last_sync_completed_at: mapping.last_sync_completed_at,
    records_processed: mapping.records_processed,
    total_records: mapping.total_records,
    error_count: mapping.error_count,
    app_name: mapping.app_name
  };
}

/**
 * Converts a GlMapping to the format expected by the database
 */
export function convertToDbMapping(mapping: GlMapping): any {
  const dbMapping = {
    id: mapping.id,
    connection_id: mapping.connection_id,
    glide_table: mapping.glide_table,
    glide_table_display_name: mapping.glide_table_display_name,
    supabase_table: mapping.supabase_table,
    column_mappings: mapping.column_mappings,
    sync_direction: mapping.sync_direction,
    enabled: mapping.enabled,
    created_at: mapping.created_at,
    updated_at: mapping.updated_at
  };
  
  return dbMapping;
}

/**
 * Returns default column mappings with $rowID mapping
 */
export function getDefaultColumnMappings(): Record<string, GlColumnMapping> {
  return {
    "$rowID": {
      "glide_column_name": "Row ID",
      "supabase_column_name": "glide_row_id", 
      "data_type": "string"
    }
  };
}
