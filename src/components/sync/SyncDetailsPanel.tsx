
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SyncLogsTable } from './SyncLogsTable';
import { SyncStatusDisplay } from './SyncStatusDisplay';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlSyncStatus, GlSyncLog } from '@/types/glsync';

interface SyncDetailsPanelProps {
  syncStatus: GlSyncStatus | null;
  syncLogs: GlSyncLog[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function SyncDetailsPanel({ 
  syncStatus, 
  syncLogs, 
  isLoading, 
  onRefresh 
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
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          <SyncLogsTable logs={syncLogs} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
