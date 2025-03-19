// Definition for Glide table structure
export interface GlideTable {
  id: string;
  display_name: string;
}

// Definition for Glide column mapping
export interface GlColumnMapping {
  glide_column_name: string;
  supabase_column_name: string;
  data_type: string;
}

// Result of a product sync operation
export interface ProductSyncResult {
  success: boolean;
  error?: string;
  recordsProcessed: number;
  failedRecords: number;
}

// Main mapping interface for Glide to Supabase mappings
export interface GlMapping {
  id: string;
  connection_id: string;
  glide_table: string;
  glide_table_display_name: string;
  supabase_table: string;
  column_mappings: Record<string, GlColumnMapping>;
  sync_direction: 'to_supabase' | 'to_glide' | 'both';
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Metrics fields (from gl_mapping_status view)
  current_status?: string;
  last_sync_started_at?: string;
  last_sync_completed_at?: string;
  records_processed?: number;
  total_records?: number;
  error_count?: number;
}

// Interface for Glide connections
export interface GlConnection {
  id: string;
  app_id: string;
  api_key: string;
  app_name: string | null;
  status?: string;
  last_sync?: string;
  created_at?: string;
  updated_at?: string;
}
