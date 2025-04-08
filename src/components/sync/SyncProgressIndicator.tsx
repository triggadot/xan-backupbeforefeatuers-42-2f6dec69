import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { useGlSyncStatus } from '@/hooks/gl-sync';
import { SyncButton } from './SyncButton';

interface SyncProgressIndicatorProps {
  mapping: {
    id: string;
    connection_id: string;
    glide_table: string;
    supabase_table: string;
    glide_table_display_name?: string;
  };
}

export function SyncProgressIndicator({ mapping }: SyncProgressIndicatorProps) {
  const { refreshData } = useGlSyncStatus();
  
  // Find sync status for this mapping
  const { syncStatus, allSyncStatuses, isLoading } = useGlSyncStatus();
  
  // Get the status for this specific mapping
  const mappingStatus = allSyncStatuses.find(status => status.mapping_id === mapping.id);
  
  // Calculate progress
  const progress = mappingStatus?.records_processed && mappingStatus?.total_records
    ? Math.min(100, Math.round((mappingStatus.records_processed / mappingStatus.total_records) * 100))
    : 0;
  
  // Determine if sync is in progress
  const isSyncing = mappingStatus?.current_status === 'running' || mappingStatus?.current_status === 'processing';
  
  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          {mapping.glide_table_display_name || mapping.glide_table}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshData()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="sr-only">Refresh</span>
          </Button>
          
          <SyncButton
            connectionId={mapping.connection_id}
            mappingId={mapping.id}
            variant="outline"
            size="sm"
            onSyncComplete={refreshData}
            showIcon={true}
            label="Sync"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {mappingStatus?.current_status === 'running' ? 'Syncing...' : 
               mappingStatus?.current_status === 'processing' ? 'Processing...' :
               mappingStatus?.current_status === 'completed' ? 'Completed' :
               mappingStatus?.current_status === 'completed_with_errors' ? 'Completed with errors' :
               mappingStatus?.current_status === 'error' ? 'Error' :
               'Ready'}
            </span>
            <span>
              {mappingStatus?.records_processed || 0} / {mappingStatus?.total_records || 0} records
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
