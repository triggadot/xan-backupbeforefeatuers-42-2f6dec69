
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlRecentLog } from '@/types/glsync';
import { formatRelative, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentSyncsCardProps {
  recentLogs: GlRecentLog[];
  isLoading: boolean;
}

export function RecentSyncsCard({ recentLogs, isLoading }: RecentSyncsCardProps) {
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
    <Card className="h-[400px] overflow-hidden">
      <CardHeader>
        <CardTitle>Recent Syncs</CardTitle>
        <CardDescription>
          Latest synchronization operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="h-5 w-20" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : recentLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No sync logs available yet
          </div>
        ) : (
          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2">
            {recentLogs.map((log) => (
              <div key={log.id} className="border-b pb-3 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(log.status)}
                    <span className="text-sm font-medium">
                      {log.glide_table_display_name || log.glide_table || 'Unknown table'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatRelative(parseISO(log.started_at), new Date())}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {log.records_processed !== null ? (
                    <span>Processed {log.records_processed} records</span>
                  ) : (
                    <span>{log.message || 'No details available'}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
