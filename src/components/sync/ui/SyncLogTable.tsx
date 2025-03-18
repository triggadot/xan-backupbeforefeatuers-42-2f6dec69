
import React from 'react';
import { SyncLog } from '@/types/syncLog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';

interface SyncLogTableProps {
  logs: SyncLog[];
  isLoading: boolean;
}

export function SyncLogTable({ logs, isLoading }: SyncLogTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-500">Processing</Badge>;
      case 'started':
        return <Badge className="bg-blue-500">Started</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Unknown date';
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm:ss');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>App/Table</TableHead>
            <TableHead className="hidden md:table-cell">Direction</TableHead>
            <TableHead className="hidden md:table-cell">Records</TableHead>
            <TableHead>Started</TableHead>
            <TableHead className="hidden md:table-cell">Completed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array(5).fill(0).map((_, index) => (
              <TableRow key={index} className="animate-pulse">
                <TableCell><div className="h-5 bg-muted rounded w-20"></div></TableCell>
                <TableCell><div className="h-5 bg-muted rounded w-32"></div></TableCell>
                <TableCell className="hidden md:table-cell"><div className="h-5 bg-muted rounded w-24"></div></TableCell>
                <TableCell className="hidden md:table-cell"><div className="h-5 bg-muted rounded w-16"></div></TableCell>
                <TableCell><div className="h-5 bg-muted rounded w-20"></div></TableCell>
                <TableCell className="hidden md:table-cell"><div className="h-5 bg-muted rounded w-20"></div></TableCell>
              </TableRow>
            ))
          ) : logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                No synchronization logs found
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{getStatusBadge(log.status)}</TableCell>
                <TableCell>
                  <div className="font-medium">
                    {log.app_name || 'Unknown App'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {log.glide_table_display_name || log.glide_table || 'Unknown Table'}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {log.sync_direction === 'to_supabase' 
                    ? 'Glide → Supabase' 
                    : log.sync_direction === 'to_glide' 
                    ? 'Supabase → Glide' 
                    : 'Bidirectional'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {log.records_processed ?? 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {formatTimeAgo(log.started_at)}
                  </div>
                  <div className="text-xs text-muted-foreground hidden sm:block">
                    {formatDateTime(log.started_at)}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {log.completed_at 
                    ? formatDateTime(log.completed_at)
                    : log.status === 'processing' || log.status === 'started'
                    ? 'In progress'
                    : 'N/A'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
