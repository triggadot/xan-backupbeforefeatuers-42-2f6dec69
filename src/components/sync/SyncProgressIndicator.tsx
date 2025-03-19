
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GlMapping, GlSyncStatus } from '@/types/glsync';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';

export interface SyncProgressIndicatorProps {
  mapping: GlMapping;
  status?: GlSyncStatus;
}

export const SyncProgressIndicator: React.FC<SyncProgressIndicatorProps> = ({ 
  mapping,
  status: initialStatus 
}) => {
  // Use the status directly since useGlSyncStatus doesn't return syncStatus
  const { status, isLoading } = useGlSyncStatus(mapping.id);
  
  const calculateProgress = () => {
    if (!status) return 0;
    
    if (status.records_processed === null || 
        status.total_records === null || 
        status.total_records === 0) {
      return 0;
    }
    
    return Math.min(100, Math.round((status.records_processed / status.total_records) * 100));
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Sync Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Records Processed</span>
            <span>
              {status?.records_processed || 0} / {status?.total_records || 0}
            </span>
          </div>
          
          <Progress value={calculateProgress()} className="h-2" />
          
          <div className="text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="capitalize">
                {status?.current_status || 'Not synced'}
              </span>
            </div>
            
            {status?.last_sync_completed_at && (
              <div className="flex justify-between mt-2">
                <span className="text-muted-foreground">Last Completed</span>
                <span>
                  {new Date(status.last_sync_completed_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
