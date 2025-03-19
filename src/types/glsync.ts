
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
  app_name?: string;
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

// For sync status
export interface GlSyncStatus {
  id: string;
  mapping_id: string;
  status: string;
  last_sync?: string;
  records_processed?: number;
  total_records?: number;
  error_count?: number;
}

// Recent sync logs
export interface GlRecentLog {
  id: string;
  status: string;
  started_at: string;
  message?: string;
  records_processed?: number;
  app_name?: string;
}

// Sync statistics
export interface GlSyncStats {
  syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  total_records_processed: number;
}

// Interface for products in Glide
export interface GlProduct {
  id: string;
  name: string;
  description?: string;
  price?: number;
  inventory?: number;
  created_at?: string;
  updated_at?: string;
}

// Sync logs for Glide
export interface GlSyncLog {
  id: string;
  mapping_id: string;
  status: string;
  message?: string;
  started_at: string;
  completed_at?: string;
  records_processed?: number;
}

// Sync record with error details
export interface GlSyncRecord {
  id: string;
  error_type: string;
  error_message: string;
  record_data?: any;
  retryable: boolean;
  created_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

// Validation results for mappings
export interface MappingValidationResult {
  isValid: boolean;
  message: string;
}

// Data for validating mappings
export interface MappingToValidate {
  connection_id: string;
  glide_table: string;
  glide_table_display_name: string;
  supabase_table: string;
  column_mappings: Record<string, GlColumnMapping>;
  sync_direction: 'to_supabase' | 'to_glide' | 'both';
}
