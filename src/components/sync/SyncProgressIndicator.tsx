import React from 'react';
import { ProgressIndicator } from './ui/ProgressIndicator';
import { GlSyncStatus } from '@/types/glsync';

interface SyncProgressIndicatorProps {
  status: GlSyncStatus | null;
  className?: string;
}

export function SyncProgressIndicator({ status, className = '' }: SyncProgressIndicatorProps) {
  if (!status) {
    return (
      <div className={`text-center py-2 text-muted-foreground ${className}`}>
        No sync status available.
      </div>
    );
  }

  const showProgress = status.current_status === 'processing' || 
                       status.current_status === 'started' ||
                       (status.records_processed && status.records_processed > 0);

  if (!showProgress) {
    return (
      <div className={`text-center py-2 text-muted-foreground ${className}`}>
        No sync progress data available.
      </div>
    );
  }

  return (
    <div className={className}>
      <ProgressIndicator
        current={status.records_processed} 
        total={status.total_records}
        size="lg"
      />
    </div>
  );
}
