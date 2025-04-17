import React from 'react';
import { CheckCircle, AlertTriangle, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { GlSyncStatus } from '@/types/glide-sync/glsync';
import { formatDistance } from 'date-fns';

// --- Validation Display Types and Component ---
export interface ValidationResult {
  isValid: boolean;
  message: string;
  errors?: string[];
  details?: Record<string, string[]>;
}

export interface ValidationDisplayProps {
  validation: ValidationResult | null;
}

export const ValidationDisplay: React.FC<ValidationDisplayProps> = ({ validation }) => {
  if (!validation) {
    return null;
  }

  return (
    <Alert variant={validation.isValid ? "success" : "destructive"}>
      <div className="flex items-start">
        <div className="mr-2 mt-0.5">
          {validation.isValid ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
        <div>
          <AlertTitle>
            {validation.isValid ? 'Validation Successful' : 'Validation Failed'}
          </AlertTitle>
          <AlertDescription>
            {validation.message}
            
            {/* Display any errors if provided */}
            {!validation.isValid && validation.errors && validation.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-sm">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
            
            {/* Display any detailed errors by field */}
            {!validation.isValid && validation.details && Object.keys(validation.details).length > 0 && (
              <div className="mt-2 text-sm">
                {Object.entries(validation.details).map(([key, errors]) => (
                  <div key={key} className="mb-1">
                    <strong>{key}:</strong>
                    <ul className="list-disc pl-5">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

// --- Sync Status Display Types and Component ---
export interface SyncStatusDisplayProps {
  status: GlSyncStatus | null;
}

export const SyncStatusDisplay: React.FC<SyncStatusDisplayProps> = ({ status }) => {
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
}; 