
import React from 'react';
import { ErrorDisplay } from './ui/ErrorDisplay';
import { ErrorSeverity } from './ui/ErrorDisplay';
import { GlSyncStatus } from '@/types/glsync';

interface SyncStatusMessageProps {
  success?: boolean;
  message?: string;
  recordsProcessed?: number;
  failedRecords?: number;
  status?: GlSyncStatus;
  isLoading?: boolean;
  error?: string;
}

export function SyncStatusMessage({ 
  success, 
  message, 
  recordsProcessed, 
  failedRecords,
  status,
  isLoading,
  error
}: SyncStatusMessageProps) {
  if (status) {
    const statusMessage = error || (status.error_count ? `Failed with ${status.error_count} errors` : 'Sync completed successfully');
    
    return (
      <ErrorDisplay
        severity={status.error_count ? 'error' : 'info'}
        title={status.error_count ? 'Sync Failed' : 'Sync Completed'}
        errors={statusMessage}
      />
    );
  }
  
  if (!message) return null;

  const severity: ErrorSeverity = success ? 'info' : 'error';
  const title = success ? 'Sync Completed' : 'Sync Failed';
  
  let formattedMessage = message;
  if (recordsProcessed !== undefined) {
    formattedMessage += `\nProcessed ${recordsProcessed} records`;
    if (failedRecords) {
      formattedMessage += ` with ${failedRecords} failures`;
    }
  }

  return (
    <ErrorDisplay
      errors={formattedMessage}
      title={title}
      severity={severity}
    />
  );
}
