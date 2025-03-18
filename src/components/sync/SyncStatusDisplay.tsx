
import React from 'react';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GlSyncStatus } from '@/types/glsync';
import { formatDistance } from 'date-fns';

interface SyncStatusDisplayProps {
  status: GlSyncStatus | null;
}

export function SyncStatusDisplay({ status }: SyncStatusDisplayProps) {
  const getStatusBadge = () => {
    if (!status?.current_status) {
      return <Badge variant="outline">Not synced</Badge>;
    }

    switch (status.current_status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'started':
        return <Badge className="bg-yellow-500">Started</Badge>;
      default:
        return <Badge variant="outline">{status.current_status}</Badge>;
    }
  };

  const getLastSyncTime = () => {
    if (!status?.last_sync_completed_at) return 'Never';
    
    try {
      return formatDistance(new Date(status.last_sync_completed_at), new Date(), { addSuffix: true });
    } catch (e) {
      return 'Unknown';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Status</p>
        <div className="flex items-center gap-2">
          {status?.current_status === 'processing' ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          ) : status?.current_status === 'completed' ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : status?.current_status === 'failed' ? (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          ) : (
            <div className="h-4 w-4" />
          )}
          <span className="text-sm">
            {status?.current_status ? 
              status.current_status.charAt(0).toUpperCase() + status.current_status.slice(1) :
              'Not synced'}
          </span>
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm font-medium">Last Sync</p>
        <p className="text-sm">{getLastSyncTime()}</p>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm font-medium">Records</p>
        <p className="text-sm">
          {status?.records_processed !== null ? status.records_processed : 0} 
          {' '}/{' '}
          {status?.total_records !== null ? status.total_records : '?'}
        </p>
      </div>
    </div>
  );
}
