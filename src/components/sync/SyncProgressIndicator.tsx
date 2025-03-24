
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { GlSyncStatus } from '@/types/glsync';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';
import { formatDistanceToNow } from 'date-fns';

interface SyncProgressIndicatorProps {
  mappingId?: string;
  syncStatus?: GlSyncStatus | null;
  onRefresh?: () => Promise<void>;
  className?: string;
}

export function SyncProgressIndicator({ 
  mappingId, 
  syncStatus: propSyncStatus,
  onRefresh,
  className = '' 
}: SyncProgressIndicatorProps) {
  // If mappingId is provided but no syncStatus, use the hook to get it
  const { 
    syncStatus: hookSyncStatus, 
    isLoading,
    refreshStatus
  } = !propSyncStatus && mappingId ? useGlSyncStatus(mappingId) : { syncStatus: null, isLoading: false, refreshStatus: async () => {} };
  
  // Use the provided syncStatus, or the one from the hook
  const syncStatus = propSyncStatus || hookSyncStatus;
  
  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    } else if (refreshStatus) {
      await refreshStatus();
    }
  };
  
  const getProgress = () => {
    if (!syncStatus) return 0;
    
    if (syncStatus.current_status === 'processing' || syncStatus.current_status === 'started') {
      if (syncStatus.records_processed === null || syncStatus.total_records === null) {
        return 0;
      }
      
      // Calculate percentage
      const percentage = syncStatus.total_records > 0 
        ? Math.min(100, Math.round((syncStatus.records_processed / syncStatus.total_records) * 100))
        : 0;
      
      return percentage;
    }
    
    // Return 100 for completed, 0 for anything else
    return syncStatus.current_status === 'completed' ? 100 : 0;
  };
  
  const getStatusIcon = () => {
    if (!syncStatus) return <Clock className="h-4 w-4 text-muted-foreground" />;
    
    switch (syncStatus.current_status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
      case 'started':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  const getLastSyncTime = () => {
    if (!syncStatus || !syncStatus.last_sync_started_at) {
      return 'Never';
    }
    
    try {
      return `${formatDistanceToNow(new Date(syncStatus.last_sync_started_at))} ago`;
    } catch (e) {
      return 'Unknown';
    }
  };
  
  if (isLoading) {
    return (
      <div className={`flex items-center text-sm text-muted-foreground ${className}`}>
        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
        Loading...
      </div>
    );
  }
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <div className="flex items-center">
          {getStatusIcon()}
          <span className="ml-2">
            {!syncStatus ? 'No sync data' : 
             syncStatus.current_status === 'processing' ? 'Syncing...' :
             syncStatus.current_status === 'completed' ? 'Sync complete' :
             syncStatus.current_status === 'failed' ? 'Sync failed' :
             syncStatus.current_status === 'started' ? 'Starting sync...' :
             'Not synced yet'}
          </span>
        </div>
        <span className="text-muted-foreground">Last sync: {getLastSyncTime()}</span>
      </div>
      
      <Progress value={getProgress()} className="h-1.5" />
      
      {syncStatus && syncStatus.records_processed !== null && (
        <div className="text-xs text-muted-foreground text-right">
          {syncStatus.records_processed} / {syncStatus.total_records || '?'} records processed
        </div>
      )}
    </div>
  );
}
