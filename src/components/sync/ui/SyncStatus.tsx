
import React from 'react';
import { CheckCircle, AlertTriangle, Loader2, Clock } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { GlSyncStatus } from '@/types/glsync';
import { ProgressIndicator } from './ProgressIndicator';
import { getStatusColor, getStatusIcon } from './StatusBadgeUtils';

interface SyncStatusProps {
  status: GlSyncStatus | null;
  showProgress?: boolean;
  className?: string;
  compact?: boolean;
}

export function SyncStatus({ 
  status, 
  showProgress = true,
  className = '',
  compact = false
}: SyncStatusProps) {
  const getLastSyncTime = () => {
    if (!status?.last_sync_completed_at) return 'Never';
    
    try {
      return formatDistance(new Date(status.last_sync_completed_at), new Date(), { addSuffix: true });
    } catch (e) {
      return 'Unknown';
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {status?.current_status === 'processing' ? (
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        ) : status?.current_status === 'completed' ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : status?.current_status === 'failed' ? (
          <AlertTriangle className="h-4 w-4 text-red-500" />
        ) : (
          <Clock className="h-4 w-4 text-gray-400" />
        )}
        <span className="text-sm">
          {status?.current_status ? 
            status.current_status.charAt(0).toUpperCase() + status.current_status.slice(1) :
            'Not synced'}
        </span>
        {status?.records_processed !== null && status?.total_records !== null && (
          <span className="text-xs text-muted-foreground">
            ({status.records_processed}/{status.total_records})
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Status</p>
          <div className="flex items-center gap-2">
            {getStatusIcon(status?.current_status || null)}
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
      
      {showProgress && status && (status.current_status === 'processing' || status.current_status === 'started') && (
        <ProgressIndicator 
          current={status.records_processed} 
          total={status.total_records}
          label="Sync Progress"
        />
      )}
    </div>
  );
}

export default SyncStatus;
