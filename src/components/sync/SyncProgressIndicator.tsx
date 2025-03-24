import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlMapping, GlSyncStatus } from '@/types/glsync';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';
import { ProgressIndicator } from './ui/ProgressIndicator';

export interface SyncProgressIndicatorProps {
  mapping: GlMapping;
  status?: GlSyncStatus;
}

export const SyncProgressIndicator: React.FC<SyncProgressIndicatorProps> = ({ 
  mapping,
  status: initialStatus 
}) => {
  // State declarations
  
  // Hooks
  const { syncStatus } = useGlSyncStatus(mapping.id);
  
  // Return/render component
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Sync Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ProgressIndicator 
            current={syncStatus?.records_processed} 
            total={syncStatus?.total_records}
            showText={true}
            showPercentage={true}
          />
          
          <div className="text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="capitalize">
                {syncStatus?.current_status || 'Not synced'}
              </span>
            </div>
            
            {syncStatus?.last_sync_completed_at && (
              <div className="flex justify-between mt-2">
                <span className="text-muted-foreground">Last Completed</span>
                <span>
                  {new Date(syncStatus.last_sync_completed_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
