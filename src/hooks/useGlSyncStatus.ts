import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlSyncStatus, GlRecentLog, GlSyncStats } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeMappings } from './useRealtimeMappings';

export function useGlSyncStatus(mappingId?: string) {
  const [syncStatus, setSyncStatus] = useState<GlSyncStatus | null>(null);
  const [allSyncStatuses, setAllSyncStatuses] = useState<GlSyncStatus[]>([]);
  const [recentLogs, setRecentLogs] = useState<GlRecentLog[]>([]);
  const [syncStats, setSyncStats] = useState<GlSyncStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Get mappings data directly
  const { mappings, isLoading: mappingsLoading, refreshMappings } = useRealtimeMappings();

  // Generate sync status from mappings
  const fetchSyncStatus = useCallback(async () => {
    setIsLoading(true);
    
    try {
      if (!mappings || mappingsLoading) {
        return;
      }
      
      // Create simple status objects from mappings data
      const statusObjects: GlSyncStatus[] = mappings.map(mapping => ({
        mapping_id: mapping.id,
        connection_id: mapping.connection_id,
        glide_table: mapping.glide_table,
        supabase_table: mapping.supabase_table,
        app_name: mapping.app_name || null,
        glide_table_display_name: mapping.glide_table_display_name,
        current_status: 'ready',
        enabled: mapping.enabled,
        error_count: 0,
        records_processed: 0,
        total_records: 0,
        sync_direction: mapping.sync_direction as 'to_supabase' | 'to_glide' | 'both',
        last_sync_started_at: null,
        last_sync_completed_at: null
      }));
      
      // Update state
      setAllSyncStatuses(statusObjects);
      
      // If mappingId is provided, find and set the specific status
      if (mappingId) {
        const statusForMapping = statusObjects.find(status => status.mapping_id === mappingId);
        setSyncStatus(statusForMapping || null);
      } else {
        setSyncStatus(null);
      }
      
      setHasError(false);
      setErrorMessage(null);
    } catch (error) {
      console.error('Error generating sync status:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      toast({
        title: 'Error',
        description: 'Failed to fetch synchronization status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [mappings, mappingId, mappingsLoading, toast]);

  // Simple mock data for logs
  const fetchRecentLogs = useCallback(async () => {
    try {
      // Create mock recent logs that match the GlRecentLog interface
      const mockLogs: GlRecentLog[] = mappings.slice(0, 5).map((mapping, index) => ({
        id: `mock-log-${index}`,
        status: 'completed',
        message: `Successfully synced ${mapping.glide_table_display_name}`,
        records_processed: 100,
        started_at: new Date(Date.now() - 86400000 * index).toISOString(),
        glide_table: mapping.glide_table,
        glide_table_display_name: mapping.glide_table_display_name,
        supabase_table: mapping.supabase_table,
        app_name: mapping.app_name || null,
        sync_direction: mapping.sync_direction
      }));
      
      setRecentLogs(mockLogs);
    } catch (error) {
      console.error('Error creating mock logs:', error);
    }
  }, [mappings]);

  // Simple mock data for stats
  const fetchSyncStats = useCallback(async () => {
    try {
      // Create mock sync stats for the last 7 days that match the GlSyncStats interface
      const mockStats: GlSyncStats[] = Array.from({ length: 7 }).map((_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - index);
        const dateString = date.toISOString().split('T')[0];
        
        const totalSyncs = Math.floor(Math.random() * 10) + 1;
        const successfulSyncs = Math.floor(Math.random() * 8) + 1;
        
        return {
          sync_date: dateString,
          syncs: totalSyncs,
          successful_syncs: successfulSyncs,
          failed_syncs: totalSyncs - successfulSyncs,
          total_records_processed: Math.floor(Math.random() * 1000) + 100
        };
      });
      
      setSyncStats(mockStats);
    } catch (error) {
      console.error('Error creating mock stats:', error);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchSyncStatus(),
      fetchRecentLogs(),
      fetchSyncStats()
    ]);
  }, [fetchSyncStatus, fetchRecentLogs, fetchSyncStats]);

  useEffect(() => {
    refreshData();
    
    // Set up a polling interval to refresh data periodically
    const interval = setInterval(() => {
      refreshData();
    }, 30000); // Refresh every 30 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, [refreshData]);

  return {
    syncStatus,
    allSyncStatuses,
    recentLogs,
    syncStats,
    isLoading: isLoading || mappingsLoading,
    hasError,
    errorMessage,
    refreshStatus: fetchSyncStatus,
    refreshData
  };
}
