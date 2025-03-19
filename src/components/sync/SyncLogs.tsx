
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRealtimeSyncLogs } from '@/hooks/useRealtimeSyncLogs';
import { SyncLogTable } from '@/components/sync/ui/SyncLogTable';
import { RefreshCw } from 'lucide-react';
import { SyncLogFilter } from '@/types/syncLog';

export default function SyncLogs() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { logs, isLoading, refetch, filterLogs, currentFilter } = useRealtimeSyncLogs({
    limit: 100,
    autoRefetch: true,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleFilterChange = (status: string | null) => {
    const newFilter: SyncLogFilter = { ...currentFilter } as SyncLogFilter;
    
    if (status) {
      newFilter.status = status;
    } else {
      delete newFilter.status;
    }
    
    filterLogs?.(newFilter);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">Sync Logs</CardTitle>
          <p className="text-sm text-muted-foreground">
            Recent synchronization activity
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Button 
            variant={!currentFilter?.status ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleFilterChange(null)}
          >
            All
          </Button>
          <Button 
            variant={currentFilter?.status === "completed" ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("completed")}
          >
            Completed
          </Button>
          <Button 
            variant={currentFilter?.status === "failed" ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("failed")}
          >
            Failed
          </Button>
          <Button 
            variant={currentFilter?.status === "completed_with_errors" ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("completed_with_errors")}
          >
            Warnings
          </Button>
          <Button 
            variant={currentFilter?.status === "processing" ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("processing")}
          >
            In Progress
          </Button>
        </div>
        
        <SyncLogTable logs={logs} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
}
