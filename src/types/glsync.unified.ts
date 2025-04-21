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

/**
 * @deprecated Only use Glide-to-Supabase sync as described in the documentation.
 * All other sync methods are deprecated.
 */
export const DEPRECATED_SYNC_NOTICE = 'This sync method is deprecated. Use the primary Glide-to-Supabase method instead.';

/**
 * Database table type definitions to match the actual schema
 * These interfaces define the exact structure of each table in Supabase
 */

// Account table definition
export interface GlAccount {
  id: string;
  glide_row_id?: string;
  account_name?: string;
  client_type?: string;
  accounts_uid: string;
  date_added_client?: string;
  email_of_who_added?: string;
  photo?: string;
  created_at?: string;
  updated_at?: string;
  balance?: number;
  customer_balance?: number;
  vendor_balance?: number;
}

// Product table definition
export interface GlProduct {
  id: string;
  glide_row_id: string;
  rowid_accounts?: string;
  rowid_vendor_payments?: string;
  rowid_purchase_orders?: string;
  po_poui_dfrom_add_prod?: string;
  po_po_date?: string;
  vendor_product_name?: string;
  new_product_name?: string;
  product_purchase_date?: string;
  total_qty_purchased?: number;
  cost?: number;
  samples_or_fronted?: boolean;
  fronted?: boolean;
  terms_for_fronted_product?: string;
  samples?: boolean;
  total_units_behind_sample?: number;
  purchase_notes?: string;
  miscellaneous_items?: boolean;
  category?: string;
  product_image1?: string;
  date_timestamp_subm?: string;
  email_email_of_user_who_added_product?: string;
  created_at?: string;
  updated_at?: string;
  display_name?: string;
  total_cost?: number;
}

// Customer Payment table definition
export interface GlCustomerPayment {
  id: string;
  glide_row_id: string;
  payment_amount?: number;
  date_of_payment?: string;
  type_of_payment?: string;
  payment_note?: string;
  rowid_invoices?: string;
  rowid_accounts?: string;
  email_of_user?: string;
  created_at?: string;
  updated_at?: string;
}

// Estimate table definition
export interface GlEstimate {
  id: string;
  glide_row_id: string;
  rowid_invoices?: string;
  rowid_accounts?: string;
  estimate_date?: string;
  is_a_sample?: boolean;
  date_invoice_created_date?: string;
  add_note?: boolean;
  valid_final_create_invoice_clicked?: boolean;
  glide_pdf_url?: string;
  glide_pdf_url2?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  total_amount?: number;
  total_credits?: number;
  balance?: number;
  estimate_uid?: string;
  status?: string;
  supabase_pdf_url?: string;
}

// Invoice line table definition
export interface GlInvoiceLine {
  id: string;
  glide_row_id: string;
  renamed_product_name?: string;
  date_of_sale?: string;
  rowid_invoices?: string;
  rowid_products?: string;
  qty_sold?: number;
  selling_price?: number;
  product_sale_note?: string;
  user_email_of_added?: string;
  created_at?: string;
  updated_at?: string;
  line_total?: number;
  product_name_display?: string;
}

// Purchase Order table definition
export interface GlPurchaseOrder {
  id: string;
  glide_row_id: string;
  po_date?: string;
  rowid_accounts?: string;
  purchase_order_uid?: string;
  date_payment_date_mddyyyy?: string;
  docs_shortlink?: string;
  created_at?: string;
  updated_at?: string;
  pdf_link?: string;
  total_amount?: number;
  total_paid?: number;
  balance?: number;
  payment_status?: string;
  product_count?: number;
  supabase_pdf_url?: string;
}

// Invoice table definition
export interface GlInvoice {
  id: string;
  glide_row_id: string;
  rowid_accounts?: string;
  invoice_date?: string;
  is_a_sample?: boolean;
  invoice_uid?: string;
  glide_pdf_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  total_amount?: number;
  total_paid?: number;
  balance?: number;
  status?: string;
  supabase_pdf_url?: string;
}

// Type to map table names to their corresponding interfaces
export type TableTypeMap = {
  gl_accounts: GlAccount;
  gl_products: GlProduct;
  gl_customer_payments: GlCustomerPayment;
  gl_estimates: GlEstimate;
  gl_invoice_lines: GlInvoiceLine;
  gl_purchase_orders: GlPurchaseOrder;
  gl_invoices: GlInvoice;
  gl_connections: GlConnection;
  gl_mappings: GlMapping;
  gl_sync_logs: GlSyncLog;
  gl_sync_errors: GlSyncRecord;
  [key: string]: any; // For other tables
};
