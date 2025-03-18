
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

  return (
    <Alert className={success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
      {success ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <AlertCircle className="h-4 w-4 text-red-500" />
      )}
      <AlertTitle>{success ? 'Sync Completed' : 'Sync Failed'}</AlertTitle>
      <AlertDescription>
        {message}
        {recordsProcessed !== undefined && (
          <span className="block mt-1">
            Processed {recordsProcessed} records
            {failedRecords ? ` with ${failedRecords} failures` : ''}
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
}
