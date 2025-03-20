
import React from 'react';
import { ErrorDisplay, ErrorSeverity } from './ui/ErrorDisplay';

interface SyncStatusMessageProps {
  success?: boolean;
  message: string;
  recordsProcessed?: number;
  failedRecords?: number;
}

export function SyncStatusMessage({ 
  success, 
  message, 
  recordsProcessed, 
  failedRecords 
}: SyncStatusMessageProps) {
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
      message={formattedMessage}
      title={title}
      severity={severity}
    />
  );
}
