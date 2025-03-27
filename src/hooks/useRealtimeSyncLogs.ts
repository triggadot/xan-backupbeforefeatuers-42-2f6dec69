
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SyncLog, SyncLogFilter } from '@/types/syncLog';
import { useToast } from '@/hooks/use-toast';

interface UseSyncLogsOptions {
  mappingId?: string;
  limit?: number;
  includeDetails?: boolean;
  onlyFailed?: boolean;
}

export function useRealtimeSyncLogs({ 
  mappingId, 
  limit = 20, 
  includeDetails = true,
  onlyFailed = false
}: UseSyncLogsOptions = {}): {
  syncLogs: SyncLog[];
  isLoading: boolean;
  refreshLogs: () => Promise<void>;
  filter: SyncLogFilter;
  setFilter: (filter: SyncLogFilter) => void;
} {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<SyncLogFilter>('all');
  const { toast } = useToast();

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      // First query the basic sync logs
      let query = supabase
        .from('gl_sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);
      
      if (mappingId) {
        query = query.eq('mapping_id', mappingId);
      }
      
      if (onlyFailed) {
        query = query.eq('status', 'failed');
      }
      
      if (filter !== 'all') {
        if (filter === 'completed') {
          query = query.eq('status', 'completed');
        } else if (filter === 'failed') {
          query = query.eq('status', 'failed');
        }
      }
      
      const { data: logData, error } = await query;
      
      if (error) throw error;
      
      // If we need to include details, fetch them separately
      if (includeDetails && logData && logData.length > 0) {
        const syncLogsWithDetails: SyncLog[] = [];
        
        // Create mapping IDs array to fetch related data
        const mappingIds = logData
          .map(log => log.mapping_id)
          .filter(Boolean) as string[];
        
        // If we have mapping IDs, fetch the related mapping data
        if (mappingIds.length > 0) {
          const { data: mappingsData, error: mappingsError } = await supabase
            .from('gl_mappings')
            .select(`
              id,
              glide_table,
              glide_table_display_name,
              supabase_table,
              sync_direction,
              connection_id
            `)
            .in('id', mappingIds);
          
          if (mappingsError) {
            console.error('Error fetching mapping details:', mappingsError);
          }
          
          // If we have mappings, fetch the related connection data
          const connectionIds = mappingsData
            ?.map(mapping => mapping.connection_id)
            .filter(Boolean) as string[] || [];
          
          let connectionsMap: Record<string, { app_name: string }> = {};
          
          if (connectionIds.length > 0) {
            const { data: connectionsData, error: connectionsError } = await supabase
              .from('gl_connections')
              .select('id, app_name')
              .in('id', connectionIds);
            
            if (connectionsError) {
              console.error('Error fetching connection details:', connectionsError);
            }
            
            // Create a map of connection IDs to connection data
            connectionsMap = (connectionsData || []).reduce((acc, conn) => {
              acc[conn.id] = { app_name: conn.app_name };
              return acc;
            }, {} as Record<string, { app_name: string }>);
          }
          
          // Create a map of mapping IDs to mapping data with connection details
          const mappingsMap = (mappingsData || []).reduce((acc, mapping) => {
            acc[mapping.id] = {
              ...mapping,
              app_name: connectionsMap[mapping.connection_id]?.app_name
            };
            return acc;
          }, {} as Record<string, any>);
          
          // Now combine the logs with their related data
          for (const log of logData) {
            const mappingDetails = log.mapping_id ? mappingsMap[log.mapping_id] : null;
            
            syncLogsWithDetails.push({
              id: log.id,
              mapping_id: log.mapping_id,
              status: log.status,
              message: log.message,
              records_processed: log.records_processed,
              started_at: log.started_at,
              completed_at: log.completed_at,
              glide_table: mappingDetails?.glide_table || null,
              glide_table_display_name: mappingDetails?.glide_table_display_name || null,
              supabase_table: mappingDetails?.supabase_table || null,
              app_name: mappingDetails?.app_name || null,
              sync_direction: mappingDetails?.sync_direction || null
            });
          }
          
          setSyncLogs(syncLogsWithDetails);
        } else {
          // If no mapping IDs, just use the log data as is
          setSyncLogs(logData.map(log => ({
            id: log.id,
            mapping_id: log.mapping_id,
            status: log.status,
            message: log.message,
            records_processed: log.records_processed,
            started_at: log.started_at,
            completed_at: log.completed_at
          })));
        }
      } else {
        // If we don't need details, just use the log data as is
        setSyncLogs(logData || []);
      }
    } catch (error) {
      console.error('Error fetching sync logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch synchronization logs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [mappingId, limit, includeDetails, onlyFailed, filter, toast]);

  // Initial load and setup realtime subscription
  useEffect(() => {
    fetchLogs();
    
    let channel;
    if (mappingId) {
      // Subscribe to specific mapping logs
      channel = supabase
        .channel('sync-logs-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'gl_sync_logs', filter: `mapping_id=eq.${mappingId}` },
          fetchLogs
        )
        .subscribe();
    } else {
      // Subscribe to all logs
      channel = supabase
        .channel('all-sync-logs-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'gl_sync_logs' },
          fetchLogs
        )
        .subscribe();
    }
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [mappingId, fetchLogs]);

  return {
    syncLogs,
    isLoading,
    refreshLogs: fetchLogs,
    filter,
    setFilter
  };
}
