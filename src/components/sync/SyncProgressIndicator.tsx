
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlMapping, GlSyncStatus } from '@/types/glsync';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';
import { ProgressIndicator } from './ui/ProgressIndicator';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SyncProgressIndicatorProps {
  mapping: GlMapping;
  status?: GlSyncStatus;
  onRefresh?: () => void;
}

export const SyncProgressIndicator: React.FC<SyncProgressIndicatorProps> = ({ 
  mapping,
  status: initialStatus,
  onRefresh 
}) => {
  // Hooks
  const { syncStatus, refetch } = useGlSyncStatus(mapping.id);
  
  const handleRefresh = () => {
    refetch();
    if (onRefresh) {
      onRefresh();
    }
  };
  
  // Use provided status or fetched status
  const status = initialStatus || syncStatus;
  
  // Return/render component
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Sync Progress</CardTitle>
        {onRefresh && (
          <Button variant="ghost" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ProgressIndicator 
            current={status?.records_processed || 0} 
            total={status?.total_records || 0}
            showText={true}
            showPercentage={true}
          />
          
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
            
            {status?.last_sync_attempted_at && !status?.last_sync_completed_at && (
              <div className="flex justify-between mt-2">
                <span className="text-muted-foreground">Last Attempt</span>
                <span>
                  {new Date(status.last_sync_attempted_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
