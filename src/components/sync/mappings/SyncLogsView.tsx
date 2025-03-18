
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRealtimeSyncLogs } from '@/hooks/useRealtimeSyncLogs';
import { SyncLogTable } from '../ui/SyncLogTable';

export interface SyncLogsViewProps {
  mappingId: string;
}

export function SyncLogsView({ mappingId }: SyncLogsViewProps) {
  const { syncLogs, isLoading, refreshLogs } = useRealtimeSyncLogs({
    mappingId,
    limit: 20,
    includeDetails: false
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Sync Logs</CardTitle>
        <Button variant="outline" size="sm" onClick={refreshLogs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <SyncLogTable logs={syncLogs} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
}
