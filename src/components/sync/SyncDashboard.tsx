
import React, { useEffect, useState } from 'react';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';
import { useSyncData } from '@/hooks/useSyncData';
import { useRealtimeSyncLogs } from '@/hooks/useRealtimeSyncLogs';
import { Button } from '@/components/ui/button';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SyncProgressIndicator } from './SyncProgressIndicator';
import { SyncMonitoringChart } from './SyncMonitoringChart';
import { SyncStatusDisplay } from './SyncStatusDisplay';
import { SyncStatusMessage } from './SyncStatusMessage';
import { SyncMetricsCard } from './overview/SyncMetricsCard';
import { RecentActivity } from './overview/RecentActivity';
import { ActiveMappingCard } from './overview/ActiveMappingCard';

export const SyncDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const { logs, isLoading: isLogsLoading } = useRealtimeSyncLogs();
  const { status, allStatuses, isLoading: isStatusLoading, refetch } = useGlSyncStatus();
  const { 
    syncData,
    isLoading: isStatsLoading,
    error 
  } = useSyncData();
  
  const [syncRunning, setSyncRunning] = useState<boolean>(false);
  const [syncChannel, setSyncChannel] = useState<RealtimeChannel | null>(null);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const [processedRecords, setProcessedRecords] = useState<number>(0);
  const [failedRecords, setFailedRecords] = useState<number>(0);
  
  useEffect(() => {
    // Subscribe to sync progress updates
    const channel = supabase.channel('sync-progress')
      .on('broadcast', { event: 'sync-progress' }, (payload) => {
        const { progress, total, processed, failed } = payload.payload;
        setSyncProgress(Math.round((progress / total) * 100));
        setProcessedRecords(processed);
        setFailedRecords(failed);
      })
      .on('broadcast', { event: 'sync-complete' }, (payload) => {
        setSyncRunning(false);
        setSyncSuccess(payload.payload.success);
        if (!payload.payload.success) {
          setSyncError(payload.payload.error);
        }
        refetch();
      })
      .on('broadcast', { event: 'sync-start' }, () => {
        setSyncRunning(true);
        setSyncProgress(0);
        setSyncError(null);
        setProcessedRecords(0);
        setFailedRecords(0);
      })
      .subscribe();

    setSyncChannel(channel);

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [refetch]);

  const handleRunSync = async () => {
    try {
      setSyncRunning(true);
      setSyncProgress(0);
      setSyncError(null);
      setProcessedRecords(0);
      setFailedRecords(0);
      
      // Start the sync process
      const response = await fetch('/api/sync/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'An error occurred');
      setSyncRunning(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Sync Status</CardTitle>
          </CardHeader>
          <CardContent>
            {syncRunning ? (
              <div className="space-y-4">
                <SyncProgressIndicator progress={syncProgress} />
                <p className="text-sm text-muted-foreground">
                  Processing records: {processedRecords} processed
                  {failedRecords > 0 && `, ${failedRecords} failed`}
                </p>
              </div>
            ) : (
              <SyncStatusDisplay status={status} />
            )}
            
            <div className="mt-4">
              <Button 
                onClick={handleRunSync} 
                disabled={syncRunning || isStatusLoading}
                className="w-full sm:w-auto"
              >
                {syncRunning ? 'Sync Running...' : 'Run Full Sync'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Active Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-3xl">
              {isStatusLoading ? (
                <span className="text-muted-foreground">Loading...</span>
              ) : (
                allStatuses.filter(s => s.enabled).length
              )}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                of {allStatuses.length} total
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
      
      <SyncStatusMessage 
        success={syncSuccess} 
        error={syncError || undefined} 
        recordsProcessed={processedRecords} 
        failedRecords={failedRecords} 
        status={status} 
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="mappings">Mappings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <SyncMonitoringChart data={syncData} isLoading={isStatsLoading} />
            </div>
            
            <div className="space-y-6">
              <SyncMetricsCard />
              <ActiveMappingCard mapping={allStatuses[0]} isLoading={isStatusLoading} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="activity" className="mt-6">
          <RecentActivity logs={logs} isLoading={isLogsLoading} />
        </TabsContent>
        
        <TabsContent value="mappings" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allStatuses.map((mappingStatus) => (
              <Card key={mappingStatus.mapping_id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg truncate">
                    {mappingStatus.glide_table_display_name || mappingStatus.glide_table}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-medium ${mappingStatus.current_status === 'error' ? 'text-destructive' : ''}`}>
                      {mappingStatus.current_status || 'Not synced'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Records</span>
                    <span className="font-medium">
                      {mappingStatus.records_processed || 0} / {mappingStatus.total_records || 0}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Sync</span>
                    <span className="font-medium">
                      {mappingStatus.last_sync_completed_at 
                        ? new Date(mappingStatus.last_sync_completed_at).toLocaleString() 
                        : 'Never'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Direction</span>
                    <span className="font-medium capitalize">
                      {mappingStatus.sync_direction?.replace('_', ' ') || 'Unknown'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
