
import React from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SyncLog } from '@/types/syncLog';
import { Badge } from '@/components/ui/badge';

interface SyncLogTableProps {
  logs: SyncLog[];
}

export const SyncLogTable: React.FC<SyncLogTableProps> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        No sync logs available
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'started':
        return <Badge variant="outline">Started</Badge>;
      case 'processing':
        return <Badge variant="warning">Processing</Badge>;
      case 'completed_with_errors':
        return <Badge variant="warning">Completed with errors</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Records</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="whitespace-nowrap">
                {format(new Date(log.started_at), 'MMM d, HH:mm')}
              </TableCell>
              <TableCell>{getStatusBadge(log.status)}</TableCell>
              <TableCell>{log.records_processed || 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SyncLogTable;
