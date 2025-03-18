
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SyncLog } from '@/types/syncLog';
import { formatRelative } from 'date-fns';

interface SyncLogsViewProps {
  logs: SyncLog[];
  onRefresh: () => void;
}

export function SyncLogsView({ logs, onRefresh }: SyncLogsViewProps) {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await onRefresh();
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'started':
        return <Badge className="bg-yellow-500">Started</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No sync logs available. Run a sync to see results.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const startedAt = new Date(log.started_at);
                  const completedAt = log.completed_at ? new Date(log.completed_at) : null;
                  
                  const duration = completedAt 
                    ? ((completedAt.getTime() - startedAt.getTime()) / 1000).toFixed(1) + 's'
                    : 'In progress';
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatRelative(startedAt, new Date())}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>{log.records_processed || 0}</TableCell>
                      <TableCell>{duration}</TableCell>
                      <TableCell className="max-w-[400px] truncate">{log.message || '-'}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
