
export interface SyncLog {
  id: string;
  mapping_id: string | null;
  status: string;
  message: string | null;
  records_processed: number | null;
  started_at: string;
  completed_at: string | null;
  glide_table?: string | null;
  glide_table_display_name?: string | null;
  supabase_table?: string | null;
  app_name?: string | null;
  sync_direction?: string | null;
  // Additional fields for error tracking
  error_count?: number;
  error_message?: string | null;
}

export interface Mapping {
  id: string;
  connection_id: string;
  glide_table: string;
  glide_table_display_name: string;
  supabase_table: string;
  column_mappings: any; // This can be a string or an object depending on how it's stored
  sync_direction: string;
  enabled: boolean;
  app_name?: string;
  current_status?: string;
  last_sync_completed_at?: string | null;
  error_count?: number;
  total_records?: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface MappingToValidate {
  supabase_table: string;
  column_mappings: Record<string, {
    glide_column_name: string;
    supabase_column_name: string;
    data_type: string;
  }>;
}

// Added ValidationResult type for type checking validation results
export interface ValidationResult {
  isValid: boolean;
  message: string;
  details?: Record<string, string[]>;
}

// Type for filter states
export type SyncLogFilter = 'all' | 'completed' | 'failed';
