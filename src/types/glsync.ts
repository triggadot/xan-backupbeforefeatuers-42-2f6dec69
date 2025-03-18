
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

export interface GlSyncStats {
  total_mappings: number;
  active_mappings: number;
  records_synced: number;
  failed_records: number;
  last_sync?: string;
}

export interface GlSyncRecord {
  id: string;
  mapping_id: string;
  type: string;
  message: string;
  timestamp: string;
  record_data?: any;
  resolved?: boolean;
  record?: any;
  retryable?: boolean;
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

export interface GlRecentLog {
  id: string;
  mapping_id: string;
  status: string;
  timestamp: string;
  records_processed: number;
  mapping_name: string;
  connection_name: string;
}

export interface GlProduct {
  id: string;
  name: string;
  description?: string;
  price?: number;
  glide_row_id: string;
}

export interface SyncRequestPayload {
  mapping_id: string;
  connection_id: string;
  direction?: "to_supabase" | "to_glide" | "both";
}
