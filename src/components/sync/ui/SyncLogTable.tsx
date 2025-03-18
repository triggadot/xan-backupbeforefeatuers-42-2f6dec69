import React from 'react';
import { SyncLog } from '@/types/syncLog';
import { GlSyncLog } from '@/types/glsync';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getStatusBadge } from './StatusBadgeUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { formatTimeAgo, formatDateTime, formatDuration } from '@/utils/date-utils';

interface SyncLogTableProps {
  logs: SyncLog[] | GlSyncLog[];
  isLoading: boolean;
  showAppInfo?: boolean;
}

export function SyncLogTable({ logs, isLoading, showAppInfo = false }: SyncLogTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-3 animate-pulse flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return <p className="text-center py-4 text-muted-foreground">No synchronization logs found.</p>;
  }

  // Check if the logs have app_name property (SyncLog type)
  const hasAppInfo = showAppInfo && 'app_name' in logs[0];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          {hasAppInfo && <TableHead>App</TableHead>}
          {hasAppInfo && <TableHead>Table</TableHead>}
          <TableHead>Started</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Records</TableHead>
          <TableHead>Message</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map(log => (
          <TableRow key={log.id}>
            <TableCell>{getStatusBadge(log.status)}</TableCell>
            {hasAppInfo && 'app_name' in log && (
              <TableCell>{log.app_name || '-'}</TableCell>
            )}
            {hasAppInfo && 'glide_table_display_name' in log && (
              <TableCell>{log.glide_table_display_name || '-'}</TableCell>
            )}
            <TableCell>{formatTimeAgo(log.started_at)}</TableCell>
            <TableCell>
              {formatDuration(log.started_at, log.completed_at)}
            </TableCell>
            <TableCell>{log.records_processed || '-'}</TableCell>
            <TableCell className="max-w-xs truncate">{log.message || '-'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
