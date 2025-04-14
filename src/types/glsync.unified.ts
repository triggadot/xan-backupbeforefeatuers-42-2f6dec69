/**
 * @file glsync.unified.ts
 * Unified type definitions for Glide-Supabase sync system.
 * This file serves as the single source of truth for all sync-related types.
 */

// Connection related types
export interface GlConnection {
  id: string;
  app_id: string;
  api_key: string;
  app_name: string | null;
  last_sync: string | null;
  created_at: string | null;
  status?: string;
  settings?: Record<string, any> | null;
}

// Column mapping types
export interface GlColumnMapping {
  glide_column_name: string;
  supabase_column_name: string;
  data_type: 'string' | 'number' | 'boolean' | 'date-time' | 'image-uri' | 'email-address';
}

// Mapping related types
export interface GlMapping {
  id: string;
  connection_id: string;
  glide_table: string;
  glide_table_display_name: string;
  supabase_table: string;
  column_mappings: Record<string, GlColumnMapping>;
  sync_direction: 'to_supabase' | 'to_glide' | 'both';
  enabled: boolean;
  created_at: string | null;
  updated_at: string | null;
  // Additional fields for UI components
  app_name?: string;
  current_status?: string;
  last_sync_completed_at?: string | null;
  error_count?: number;
  total_records?: number;
}

// For backward compatibility
export type Mapping = GlMapping;

// Validation related types
export interface MappingToValidate {
  supabase_table: string;
  column_mappings: Record<string, {
    glide_column_name: string;
    supabase_column_name: string;
    data_type: string;
  }>;
}

export interface MappingValidationResult {
  is_valid: boolean;
  validation_message: string;
}

// For camelCase convention consistency
export interface ValidationResult {
  isValid: boolean;
  message: string;
  details?: Record<string, string[]>;
}

// Sync log related types
export interface GlSyncLog {
  id: string;
  mapping_id: string | null;
  started_at: string;
  completed_at: string | null;
  status: 'started' | 'processing' | 'completed' | 'failed';
  message: string | null;
  records_processed: number | null;
  glide_table?: string | null;
  glide_table_display_name?: string | null;
  supabase_table?: string | null;
  app_name?: string | null;
  sync_direction?: string | null;
  error_count?: number;
  error_message?: string | null;
}

// For backward compatibility
export type SyncLog = GlSyncLog;

export type SyncLogFilter = 'all' | 'completed' | 'failed';

// Sync status related types
export interface GlSyncStatus {
  mapping_id: string;
  connection_id: string;
  app_name: string | null;
  glide_table: string;
  glide_table_display_name: string;
  supabase_table: string;
  sync_direction: string;
  enabled: boolean;
  current_status: string | null;
  last_sync_started_at: string | null;
  last_sync_completed_at: string | null;
  records_processed: number | null;
  error_count: number | null;
  total_records: number | null;
}

export type GlSyncStatuses = GlSyncStatus[];

// Recent log for UI display
export interface GlRecentLog {
  id: string;
  status: string;
  message: string | null;
  records_processed: number | null;
  started_at: string;
  glide_table: string | null;
  glide_table_display_name: string | null;
  supabase_table: string | null;
  app_name: string | null;
  sync_direction: string | null;
}

// Stats for dashboard
export interface GlSyncStats {
  sync_date: string;
  syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  total_records_processed: number;
}

// API request payload
export interface SyncRequestPayload {
  action: 'testConnection' | 'listGlideTables' | 'syncData' | 'getColumnMappings' | 'syncMapping';
  connectionId: string;
  mappingId?: string;
  tableId?: string;
  logLevel?: 'minimal' | 'detailed';
}

// Sync error records
export interface GlSyncRecord {
  id?: string;
  mapping_id?: string;
  type: 'VALIDATION_ERROR' | 'TRANSFORM_ERROR' | 'API_ERROR' | 'RATE_LIMIT' | 'NETWORK_ERROR';
  message: string;
  record?: any;
  timestamp: string;
  retryable: boolean;
  resolved?: boolean;
  resolution_notes?: string | null;
  // DB schema fields
  created_at?: string;
  error_type?: string;
  error_message?: string;
  record_data?: any;
  resolved_at?: string | null;
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean;
  recordsProcessed?: number;
  failedRecords?: number;
  errors?: GlSyncRecord[];
  error?: string;
  syncTime?: number; // Duration in milliseconds
}

// Alias for backward compatibility
export type ProductSyncResult = SyncResult;

// Glide table representation
export interface GlideTable {
  id: string;
  displayName: string;
}

// Props for sync error display component
export interface SyncErrorDisplayProps {
  syncErrors: GlSyncRecord[];
  onResolve?: (errorId: string, notes?: string) => Promise<boolean>;
  className?: string;
}

// Column mapping suggestion for automatic mapping
export interface ColumnMappingSuggestion {
  glide_column_name: string;
  suggested_supabase_column: string;
  data_type: string;
  confidence: number;
}

// Define TableName type here as the source of truth
export type TableName = 
  | 'gl_accounts' 
  | 'gl_connections' 
  | 'gl_customer_credits' 
  | 'gl_customer_payments'
  | 'gl_estimate_lines'
  | 'gl_estimates'
  | 'gl_expenses'
  | 'gl_invoice_lines'
  | 'gl_invoices'
  | 'gl_mappings'
  | 'gl_products'
  | 'gl_purchase_orders'
  | 'gl_shipping_records'
  | 'gl_sync_errors'
  | 'gl_sync_logs'
  | 'gl_vendor_payments'
  | 'messages'
  | 'profiles'
  | 'settings'
  | 'gl_mapping_status' // view
  | 'gl_product_sync_stats' // view
  | 'gl_recent_logs' // view
  | 'gl_sync_stats' // view
  | 'gl_tables_view'; // view
