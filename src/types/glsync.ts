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
  
  // Additional fields from gl_mapping_status view
  current_status?: string;
  last_sync_started_at?: string;
  last_sync_completed_at?: string;
  connection_id?: string;
  glide_table?: string;
  glide_table_display_name?: string;
  supabase_table?: string;
  column_mappings?: Record<string, GlColumnMapping>;
  app_name?: string;
  enabled?: boolean;
  sync_direction?: string;
}

// Recent sync logs
export interface GlRecentLog {
  id: string;
  status: string;
  started_at: string;
  message?: string;
  records_processed?: number;
  app_name?: string;
  
  // Additional fields
  glide_table?: string;
  glide_table_display_name?: string;
  supabase_table?: string;
  sync_direction?: string;
}

// Sync statistics
export interface GlSyncStats {
  syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  total_records_processed: number;
  sync_date: string; // Make this required
}

// Interface for products in Glide
export interface GlProduct {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  inventory?: number;
  created_at?: string;
  updated_at?: string;
  
  // Additional fields for gl_products
  glide_row_id?: string;
  new_product_name?: string;
  vendor_product_name?: string;
  category?: string;
  cost?: number;
  product_purchase_date?: string;
  display_name?: string;
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
  
  // Additional properties needed by components
  type?: string;
  message?: string;
  record?: any;
  timestamp?: string;
  resolved?: boolean;
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

// Export sync log type for consistency
export type GlSyncLog = SyncLog;

import { SyncLog } from './syncLog';
