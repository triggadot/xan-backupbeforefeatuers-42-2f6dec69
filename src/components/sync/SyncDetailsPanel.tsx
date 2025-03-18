
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlSyncStatus, GlSyncLog } from '@/types/glsync';
import { formatDistance } from 'date-fns';
import { SyncLogsTable } from './SyncLogsTable';
import { SyncMonitoringChart } from './SyncMonitoringChart';

interface SyncDetailsPanelProps {
  status?: GlSyncStatus | null;
  logs?: GlSyncLog[];
  isLoadingLogs: boolean;
}

export function SyncDetailsPanel({ status, logs, isLoadingLogs }: SyncDetailsPanelProps) {
  const getLastSyncTime = () => {
    if (!status?.last_sync_completed_at) return 'Never';
    
    try {
      return formatDistance(new Date(status.last_sync_completed_at), new Date(), { addSuffix: true });
    } catch (e) {
      return 'Unknown';
    }
  };

  const getStatusColor = () => {
    if (!status?.current_status) return 'bg-gray-500';
    
    switch (status.current_status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'processing': return 'bg-blue-500';
      case 'started': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sync Details</CardTitle>
            <CardDescription>Detailed information about sync operations</CardDescription>
          </div>
          {status?.current_status && (
            <Badge className={getStatusColor()}>
              {status.current_status.charAt(0).toUpperCase() + status.current_status.slice(1)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Connection Status</p>
              <p className="text-sm">{status?.app_name || 'Unknown'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Last Successful Sync</p>
              <p className="text-sm">{getLastSyncTime()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Records</p>
              <p className="text-sm">
                {status?.records_processed !== null ? status.records_processed : 0} processed / 
                {status?.error_count !== null ? status.error_count : 0} errors
              </p>
            </div>
          </div>

          <Tabs defaultValue="logs">
            <TabsList>
              <TabsTrigger value="logs">Sync Logs</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
            </TabsList>
            <TabsContent value="logs">
              <SyncLogsTable logs={logs || []} isLoading={isLoadingLogs} />
            </TabsContent>
            <TabsContent value="metrics">
              <SyncMonitoringChart mappingId={status?.mapping_id} />
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
