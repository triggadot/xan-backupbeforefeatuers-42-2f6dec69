
export interface GlConnection {
  id: string;
  app_id: string;
  api_key: string;
  app_name: string | null;
  last_sync: string | null;
  created_at: string | null;
  status?: string;
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
  connection_id: string;
  mapping_id: string;
  last_sync_started_at: string | null;
  last_sync_completed_at: string | null;
  current_status: string | null;
  enabled: boolean;
  app_name: string | null;
  glide_table: string;
  glide_table_display_name: string;
  supabase_table: string;
  sync_direction: string;
  records_processed: number | null;
  total_records: number | null;
}

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
  po_poui_dfrom_add_prod?: string;
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

// New interface for sync error records
export interface GlSyncRecord {
  type: 'VALIDATION_ERROR' | 'TRANSFORM_ERROR' | 'API_ERROR' | 'RATE_LIMIT' | 'NETWORK_ERROR';
  message: string;
  record?: any;
  timestamp: string;
  retryable: boolean;
}

export interface ProductSyncResult {
  total_records: number;
  processed_records: number;
  failed_records: number;
  error_records?: GlSyncRecord[];
  success: boolean;
}

export interface GlideTable {
  id: string;
  display_name: string;
}
