
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useRealtimeSyncLogs } from '@/hooks/useRealtimeSyncLogs';
import { SyncLogTable } from './ui/SyncLogTable';
import { RefreshCw } from 'lucide-react';

const SyncLogs = () => {
  const { 
    syncLogs, 
    isLoading, 
    refreshLogs, 
    filter, 
    setFilter 
  } = useRealtimeSyncLogs({
    limit: 50,
    includeDetails: true,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Synchronization Logs</h2>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(value: 'all' | 'completed' | 'failed') => setFilter(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter logs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Logs</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refreshLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Recent Sync Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <SyncLogTable logs={syncLogs} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncLogs;
