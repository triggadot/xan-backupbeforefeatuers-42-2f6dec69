
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SyncLogsTable } from './SyncLogsTable';
import { SyncStatusDisplay } from './SyncStatusDisplay';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlSyncStatus, GlSyncLog } from '@/types/glsync';
import SyncMetricsCard from './SyncMetricsCard';

interface SyncDetailsPanelProps {
  syncStatus: GlSyncStatus | null;
  logs: GlSyncLog[];
  isLoading: boolean;
  onRefresh: () => void;
  syncStats?: any[];
}

export function SyncDetailsPanel({ 
  syncStatus, 
  logs, 
  isLoading, 
  onRefresh,
  syncStats = []
}: SyncDetailsPanelProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Sync Status</CardTitle>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <SyncStatusDisplay status={syncStatus} />
        </CardContent>
      </Card>
      
      {syncStats && syncStats.length > 0 && (
        <SyncMetricsCard syncStats={syncStats} isLoading={isLoading} />
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          <SyncLogsTable logs={logs} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
