import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, RefreshCw, Check, AlertTriangle, Clock, Database, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { useGlSync } from '@/hooks/useGlSync';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';
import SyncMetricsCard from './SyncMetricsCard';
import { formatTimestamp } from '@/utils/glsync-transformers';
import { supabase } from '@/integrations/supabase/client';
import { getStatusBadge, getStatusIcon } from './ui/StatusBadgeUtils';
import { ActiveMappingCard } from './overview/ActiveMappingCard';
import { GlRecentLog, GlSyncStats } from '@/types/glsync';

const SyncDashboard = () => {
  const [mappings, setMappings] = useState([]);
  const [isLoadingMappings, setIsLoadingMappings] = useState(true);
  const { syncData } = useGlSync();
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  const [allSyncStatuses, setAllSyncStatuses] = useState([]);
  const [recentLogs, setRecentLogs] = useState<GlRecentLog[]>([]);
  const [syncStats, setSyncStats] = useState<GlSyncStats | null>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const { status, isLoading, error, refetch } = useGlSyncStatus();
  
  const refreshData = useCallback(() => {
    refetch();
  }, [refetch]);

  const fetchMappings = useCallback(async () => {
    setIsLoadingMappings(true);
    try {
      const { data, error } = await supabase
        .from('gl_mapping_status')
        .select('*')
        .order('last_sync_started_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      setMappings(data || []);
      
      setAllSyncStatuses(data || []);
    } catch (error) {
      console.error('Error fetching mappings:', error);
      toast({
        title: 'Error fetching mappings',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoadingMappings(false);
    }
  }, [toast]);

  const fetchRecentLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gl_recent_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setRecentLogs(data || []);
    } catch (error) {
      console.error('Error fetching recent logs:', error);
    }
  }, []);

  const fetchSyncStats = useCallback(async () => {
    try {
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
    } catch (error) {
      console.error('Error fetching sync stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchMappings();
    fetchRecentLogs();
    fetchSyncStats();
    
    const mappingsChannel = supabase
      .channel('gl_mappings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gl_mapping_status' }, 
        () => {
          fetchMappings();
        }
      )
      .subscribe();
    
    const logsChannel = supabase
      .channel('gl_logs_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'gl_sync_logs' },
        () => {
          fetchRecentLogs();
          fetchSyncStats();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(mappingsChannel);
      supabase.removeChannel(logsChannel);
    };
  }, [fetchMappings, fetchRecentLogs, fetchSyncStats]);

  const handleSync = async (connectionId: string, mappingId: string) => {
    setIsSyncing(prev => ({ ...prev, [mappingId]: true }));
    
    try {
      const result = await syncData(connectionId, mappingId);
      
      if (result.success) {
        toast({
          title: 'Sync started',
          description: 'The synchronization process has been initiated.',
        });
        
        setTimeout(() => {
          fetchMappings();
          refreshData();
        }, 2000);
      } else {
        toast({
          title: 'Sync failed',
          description: result.error || 'An unknown error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(prev => ({ ...prev, [mappingId]: false }));
    }
  };

  const refreshAll = () => {
    fetchMappings();
    fetchRecentLogs();
    fetchSyncStats();
    refreshData();
  };

  const displayError = hasError || !!error;
  const displayErrorMessage = errorMessage || error || 'There was an error connecting to the database. Please ensure the database tables have been created.';

  if (displayError) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
              <h3 className="text-lg font-medium">Unable to load synchronization dashboard</h3>
              <p className="text-muted-foreground">
                {displayErrorMessage}
              </p>
              <Button onClick={refreshAll}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Active Mappings</h2>
            <Button variant="outline" size="sm" onClick={refreshAll}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {isLoadingMappings ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-1/2 mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-6" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </Card>
              ))}
            </div>
          ) : mappings.length === 0 ? (
            <Card className="p-6 text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">No active mappings found.</p>
              <p className="mt-2">
                Create a connection and set up table mappings to start synchronizing data.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {mappings
                .filter(status => status.enabled)
                .map((status) => (
                  <div key={status.mapping_id} className="col-span-1">
                    <ActiveMappingCard 
                      status={status} 
                      onSync={handleSync} 
                      isSyncing={isSyncing[status.mapping_id] || false} 
                    />
                  </div>
                ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Statistics</h2>
          <SyncMetricsCard 
            syncStats={syncStats} 
            isLoading={isLoading} 
          />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
        
        {isLoading ? (
          <Card>
            <div className="p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center py-3 border-b last:border-b-0">
                  <Skeleton className="h-8 w-8 rounded-full mr-4" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : recentLogs.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">No recent activity found.</p>
          </Card>
        ) : (
          <Card>
            <div className="p-4">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start py-3 border-b last:border-b-0">
                  <div className="mr-4 mt-1">
                    {getStatusIcon(log.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {log.app_name || 'Unnamed App'}: {log.glide_table_display_name || log.glide_table || 'Unknown'} → {log.supabase_table || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {log.message || `Status: ${log.status}`}
                          {log.records_processed ? ` (${log.records_processed} records)` : ''}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {formatTimestamp(log.started_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default SyncDashboard;
