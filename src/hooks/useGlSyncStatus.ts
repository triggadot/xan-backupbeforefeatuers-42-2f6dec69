
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlRecentLog, GlSyncStats, GlSyncStatus } from '@/types/glsync';

export const useGlSyncStatus = (mappingId?: string) => {
  const [status, setStatus] = useState<GlSyncStatus | null>(null);
  const [allSyncStatuses, setAllSyncStatuses] = useState<GlSyncStatus[]>([]);
  const [recentLogs, setRecentLogs] = useState<GlRecentLog[]>([]);
  const [syncStats, setSyncStats] = useState<GlSyncStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchSyncStatus = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setHasError(false);
    
    try {
      // If mappingId is provided, fetch specific status
      if (mappingId) {
        const { data, error } = await supabase
          .from('gl_mapping_status')
          .select('*')
          .eq('mapping_id', mappingId)
          .single();
        
        if (error) throw error;
        
        // Convert database record to GlSyncStatus
        const syncStatus: GlSyncStatus = {
          id: data.mapping_id,
          status: data.current_status || 'pending',
          mapping_id: data.mapping_id,
          connection_id: data.connection_id,
          glide_table: data.glide_table,
          glide_table_display_name: data.glide_table_display_name,
          supabase_table: data.supabase_table,
          column_mappings: data.column_mappings,
          sync_direction: data.sync_direction,
          enabled: data.enabled,
          app_name: data.app_name,
          last_sync_started_at: data.last_sync_started_at,
          last_sync_completed_at: data.last_sync_completed_at,
          records_processed: data.records_processed,
          total_records: data.total_records,
          error_count: data.error_count,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        
        setStatus(syncStatus);
      } 
      // Otherwise fetch all statuses
      else {
        const { data, error } = await supabase
          .from('gl_mapping_status')
          .select('*')
          .order('last_sync_started_at', { ascending: false });
        
        if (error) throw error;
        
        // Convert database records to GlSyncStatus[]
        const statuses: GlSyncStatus[] = (data || []).map(item => ({
          id: item.mapping_id,
          status: item.current_status || 'pending',
          mapping_id: item.mapping_id,
          connection_id: item.connection_id,
          glide_table: item.glide_table,
          glide_table_display_name: item.glide_table_display_name,
          supabase_table: item.supabase_table,
          column_mappings: item.column_mappings,
          sync_direction: item.sync_direction,
          enabled: item.enabled,
          app_name: item.app_name,
          last_sync_started_at: item.last_sync_started_at,
          last_sync_completed_at: item.last_sync_completed_at,
          records_processed: item.records_processed,
          total_records: item.total_records,
          error_count: item.error_count,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));
        
        setAllSyncStatuses(statuses);
      }
      
      // Fetch recent logs
      const { data: logsData, error: logsError } = await supabase
        .from('gl_recent_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);
      
      if (logsError) throw logsError;
      setRecentLogs(logsData || []);
      
      // Fetch sync stats
      const today = new Date().toISOString().split('T')[0];
      const { data: statsData, error: statsError } = await supabase
        .from('gl_sync_logs')
        .select(`
          status,
          records_processed
        `);
      
      if (statsError) throw statsError;
      
      if (statsData) {
        const totalSyncs = statsData.length;
        const successfulSyncs = statsData.filter(log => log.status === 'completed').length;
        const failedSyncs = statsData.filter(log => log.status === 'error').length;
        const totalRecordsProcessed = statsData.reduce((sum, log) => sum + (log.records_processed || 0), 0);
        
        setSyncStats({
          syncs: totalSyncs,
          successful_syncs: successfulSyncs,
          failed_syncs: failedSyncs,
          total_records_processed: totalRecordsProcessed,
          sync_date: today
        });
      }
    } catch (err) {
      console.error('Error fetching sync status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [mappingId]);

  const refreshData = useCallback(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  useEffect(() => {
    fetchSyncStatus();
    
    // Set up realtime subscription
    const channelName = mappingId ? `sync_status_${mappingId}` : 'all_sync_statuses';
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'gl_mapping_status',
        ...(mappingId ? { filter: `mapping_id=eq.${mappingId}` } : {})
      }, () => {
        fetchSyncStatus();
      })
      .subscribe();
    
    // Set up realtime subscription for logs
    const logsChannel = supabase
      .channel('gl_logs_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'gl_sync_logs' },
        () => {
          fetchSyncStatus();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(logsChannel);
    };
  }, [mappingId, fetchSyncStatus]);

  return {
    status,
    allSyncStatuses,
    recentLogs,
    syncStats,
    isLoading,
    error,
    hasError,
    errorMessage,
    refetch: fetchSyncStatus,
    refreshData
  };
};
