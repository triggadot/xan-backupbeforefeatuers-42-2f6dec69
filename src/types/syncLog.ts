
export interface SyncLog {
  id: string;
  mapping_id: string;
  status: string;
  started_at: string;
  completed_at?: string;
  records_processed?: number;
  message?: string;
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
}
