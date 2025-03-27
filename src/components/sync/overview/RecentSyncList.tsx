
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useRealtimeSyncLogs } from '@/hooks/useRealtimeSyncLogs';
import { GlRecentLog, SyncLog } from '@/types/glsync';
import { Spinner } from '@/components/ui/spinner';
import { getStatusBadge } from '../ui/StatusBadgeUtils';

export function RecentSyncList() {
  const { syncLogs, isLoading } = useRealtimeSyncLogs();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner size="md" />
      </div>
    );
  }

  if (!syncLogs || syncLogs.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        No recent sync activities found.
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
      {syncLogs.map((log) => (
        <SyncLogItem key={log.id} log={log as unknown as GlRecentLog} />
      ))}
    </div>
  );
}

function SyncLogItem({ log }: { log: GlRecentLog }) {
  const timeAgo = log.started_at 
    ? formatDistanceToNow(new Date(log.started_at), { addSuffix: true })
    : 'Unknown time';

  return (
    <Card className="shadow-sm hover:shadow transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-sm">{log.glide_table_display_name || log.glide_table || 'Unknown table'}</h4>
            <p className="text-xs text-muted-foreground">
              {log.status === 'completed' 
                ? `${log.records_processed || 0} records processed ${timeAgo}`
                : timeAgo}
            </p>
          </div>
          {getStatusBadge(log.status)}
        </div>
      </CardContent>
    </Card>
  );
}
