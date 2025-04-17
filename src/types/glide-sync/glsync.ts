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
}

export interface GlColumnMapping {
  glide_column_name: string;
  supabase_column_name: string;
  data_type: 'string' | 'number' | 'boolean' | 'date-time' | 'image-uri' | 'email-address';
}

export interface GlSyncLog {
  id: string;
  mapping_id: string | null;
  started_at: string;
  completed_at: string | null;
  status: 'started' | 'processing' | 'completed' | 'failed';
  message: string | null;
  records_processed: number | null;
}

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

export interface GlSyncStats {
  sync_date: string;
  syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  total_records_processed: number;
}

export interface SyncRequestPayload {
  action: 'testConnection' | 'listGlideTables' | 'syncData' | 'getColumnMappings';
  connectionId: string;
  mappingId?: string;
  tableId?: string;
}

export interface GlProduct {
  id?: string;
  glide_row_id: string;
  rowid_accounts?: string;
  rowid_vendor_payments?: string;
  rowid_purchase_orders?: string;
  purchase_order_uid?: string;
  po_po_date?: string | null;
  vendor_product_name?: string;
  new_product_name?: string;
  product_purchase_date?: string | null;
  total_qty_purchased?: number | null;
  cost?: number | null;
  samples_or_fronted?: boolean;
  fronted?: boolean;
  samples?: boolean;
  terms_for_fronted_product?: string;
  total_units_behind_sample?: number | null;
  purchase_notes?: string;
  miscellaneous_items?: boolean;
  category?: string;
  product_image1?: string;
  date_timestamp_subm?: string | null;
  email_email_of_user_who_added_product?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface for sync error records
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
  // Add properties from DB schema to help with mapping
  created_at?: string;
  error_type?: string;
  error_message?: string;
  record_data?: any;
  resolved_at?: string | null;
}

/**
 * Result of a sync operation
 * Contains information about the sync process including success status,
 * number of records processed, and any errors that occurred
 */
export interface SyncResult {
  success: boolean;
  recordsProcessed?: number;
  failedRecords?: number;
  errors?: GlSyncRecord[];
  error?: string;
  total_records?: number;
  processed_records?: number;
  failed_records?: number;
  error_records?: GlSyncRecord[];
  syncTime?: number; // Duration of sync operation in milliseconds
}

// For backward compatibility
export type ProductSyncResult = SyncResult;

export interface GlideTable {
  id: string;
  displayName: string;
}

// Adding interfaces to match our new database functions
export interface MappingValidationResult {
  is_valid: boolean;
  validation_message: string;
}
  
export interface ColumnMappingSuggestion {
  glide_column_name: string;
  suggested_supabase_column: string;
  data_type: string;
  confidence: number;
}

export interface SyncErrorDisplayProps {
  syncErrors: GlSyncRecord[];
  onResolve?: (errorId: string, notes?: string) => Promise<boolean>;
  className?: string;
}

export interface GlAccount {
  id?: string;
  glide_row_id: string;
  accounts_uid?: string;
  client_type?: string;
  account_name?: string;
  email_of_who_added?: string;
  photo?: string;
  date_added_client?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Add MappingToValidate interface
export interface MappingToValidate {
  supabase_table: string;
  column_mappings: Record<string, {
    glide_column_name: string;
    supabase_column_name: string;
    data_type: string;
  }>;
}
