
import { Json } from '@/integrations/supabase/types';

export interface GlConnection {
  id: string;
  app_id: string;
  app_name?: string | null;
  api_key: string;
  created_at?: string | null;
  updated_at?: string | null;
  last_sync?: string | null;
}

export interface GlColumnMapping {
  glide_column_name: string;
  supabase_column_name: string;
  data_type: "string" | "number" | "boolean" | "date-time" | "image-uri" | "email-address";
}

export interface GlMapping {
  id: string;
  connection_id: string;
  glide_table: string;
  glide_table_display_name: string;
  supabase_table: string;
  column_mappings: Record<string, GlColumnMapping>;
  sync_direction: "to_supabase" | "to_glide" | "both";
  enabled: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface GlSyncLog {
  id: string;
  mapping_id: string;
  status: "started" | "processing" | "completed" | "failed";
  message?: string | null;
  records_processed?: number | null;
  started_at: string;
  completed_at?: string | null;
}

export interface GlSyncStatus {
  mapping_id: string;
  current_status: "idle" | "started" | "processing" | "completed" | "failed";
  last_sync_completed_at?: string | null;
  total_records?: number | null;
  records_processed?: number | null;
  error_count?: number | null;
  connection_id?: string;
  app_name?: string;
  glide_table?: string;
  glide_table_display_name?: string;
  supabase_table?: string;
  enabled?: boolean;
}

// Updated to match gl_sync_stats database view columns
export interface GlSyncStats {
  syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  total_records_processed: number;
  sync_date: string;
}

// Updated to match gl_recent_logs database view columns
export interface GlRecentLog {
  id: string;
  status: string;
  message: string | null;
  records_processed: number | null;
  started_at: string;
  app_name: string | null;
  glide_table: string | null;
  glide_table_display_name: string | null;
  supabase_table: string | null;
  sync_direction: string | null;
}

export interface GlideTable {
  id: string;
  name: string;
  displayName: string;
}

export interface MappingValidationResult {
  is_valid: boolean;
  validation_message: string;
}

export interface ProductSyncResult {
  success: boolean;
  recordsProcessed?: number;
  failedRecords?: number;
  error?: string;
}

export interface ColumnMappingSuggestion {
  glide_column_name: string;
  suggested_supabase_column: string;
  data_type: string;
  confidence: number;
}

// Update GlProduct to match what's in the database
export interface GlProduct {
  id: string;
  glide_row_id: string;
  vendor_product_name?: string;
  new_product_name?: string;
  category?: string;
  cost?: number;
  product_purchase_date?: string;
}

export interface SyncRequestPayload {
  mapping_id: string;
  connection_id: string;
  direction?: "to_supabase" | "to_glide" | "both";
}

// Type converters to help with database to frontend type conversion
export const convertDbToGlideTable = (dbItem: any): GlideTable => {
  return {
    id: dbItem.id,
    name: dbItem.name || '',
    displayName: dbItem.display_name || dbItem.displayName || ''
  };
};

export const convertDbToGlSyncStats = (dbItem: any): GlSyncStats => {
  return {
    syncs: dbItem.syncs || 0,
    successful_syncs: dbItem.successful_syncs || 0,
    failed_syncs: dbItem.failed_syncs || 0,
    total_records_processed: dbItem.total_records_processed || 0,
    sync_date: dbItem.sync_date || new Date().toISOString()
  };
};

export const convertDbToGlRecentLog = (dbItem: any): GlRecentLog => {
  return {
    id: dbItem.id || '',
    status: dbItem.status || '',
    message: dbItem.message || null,
    records_processed: dbItem.records_processed || 0,
    started_at: dbItem.started_at || new Date().toISOString(),
    app_name: dbItem.app_name || null,
    glide_table: dbItem.glide_table || null,
    glide_table_display_name: dbItem.glide_table_display_name || null,
    supabase_table: dbItem.supabase_table || null,
    sync_direction: dbItem.sync_direction || null
  };
};

export const convertDbToGlProduct = (dbItem: any): GlProduct => {
  return {
    id: dbItem.id || '',
    glide_row_id: dbItem.glide_row_id || '',
    vendor_product_name: dbItem.vendor_product_name || null,
    new_product_name: dbItem.new_product_name || null,
    category: dbItem.category || null,
    cost: typeof dbItem.cost === 'number' ? dbItem.cost : null,
    product_purchase_date: dbItem.product_purchase_date || null
  };
};
