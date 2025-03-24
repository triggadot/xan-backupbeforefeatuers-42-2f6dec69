
import React from 'react';
import { GlSyncStatus } from '@/types/glsync';
import { CheckCircle, AlertTriangle, Loader2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ProgressIndicator } from './ui/ProgressIndicator';

interface SyncStatusDisplayProps {
  status: GlSyncStatus | null;
}

export function SyncStatusDisplay({ status }: SyncStatusDisplayProps) {
  if (!status) return null;

  const getStatusIcon = () => {
    switch (status.current_status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'processing':
      case 'started':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getLastSyncText = () => {
    if (!status.last_sync_completed_at) return 'Never';
    
    try {
      return formatDistanceToNow(new Date(status.last_sync_completed_at), { addSuffix: true });
    } catch (e) {
      return 'Unknown';
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Status</p>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm">
              {status.current_status ? 
                status.current_status.charAt(0).toUpperCase() + status.current_status.slice(1) : 
                'Not synced'}
            </span>
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium">Last Sync</p>
          <p className="text-sm">{getLastSyncText()}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium">Records</p>
          <p className="text-sm">
            {status.records_processed !== null ? status.records_processed : 0} 
            {' '}/{' '}
            {status.total_records !== null ? status.total_records : '?'}
          </p>
        </div>
      </div>
      
      {status.current_status === 'processing' && status.records_processed !== null && status.total_records !== null && (
        <ProgressIndicator 
          current={status.records_processed} 
          total={status.total_records}
          label="Sync Progress"
        />
      )}
    </div>
  );
}
