
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
  supabase_table: string;
  column_mappings: Record<string, string>;
  sync_direction: 'to_supabase' | 'to_glide' | 'both';
  enabled: boolean;
  created_at: string | null;
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
  last_sync: string | null;
  current_status: string | null;
  enabled: boolean;
  app_name: string | null;
  glide_table: string;
  supabase_table: string;
  sync_direction: string;
  records_processed: number | null;
}

export interface GlRecentLog {
  id: string;
  status: string;
  message: string | null;
  records_processed: number | null;
  started_at: string;
  glide_table: string | null;
  supabase_table: string | null;
  app_name: string | null;
  sync_direction: string | null;
}

export interface SyncRequestPayload {
  action: 'testConnection' | 'listGlideTables' | 'syncData';
  connectionId: string;
  mappingId?: string;
}
