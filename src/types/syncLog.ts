
export interface SyncLog {
  id: string;
  mapping_id: string;
  status: string;
  started_at: string;
  completed_at?: string;
  records_processed?: number;
  message?: string;
  app_name?: string; // Added for compatibility
}

export interface SyncError {
  id: string;
  mapping_id: string;
  error_type: string;
  error_message: string;
  record_data?: any;
  retryable: boolean;
  created_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface UseSyncLogsOptions {
  limit?: number;
  mappingId?: string;
  autoRefetch?: boolean;
}

export interface SyncLogsResult {
  logs: SyncLog[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  data?: SyncLog[]; // Added for compatibility with existing code
}

export interface SyncLogFilter {
  mappingId?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface Mapping {
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
  
  // Metrics fields 
  current_status?: string;
  last_sync_started_at?: string;
  last_sync_completed_at?: string;
  records_processed?: number;
  total_records?: number;
  error_count?: number;
}

export interface GlColumnMapping {
  glide_column_name: string;
  supabase_column_name: string;
  data_type: string;
}
