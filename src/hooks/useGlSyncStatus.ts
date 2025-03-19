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
        setStatus(data);
      } 
      // Otherwise fetch all statuses
      else {
        const { data, error } = await supabase
          .from('gl_mapping_status')
          .select('*')
          .order('last_sync_started_at', { ascending: false });
        
        if (error) throw error;
        setAllSyncStatuses(data || []);
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
