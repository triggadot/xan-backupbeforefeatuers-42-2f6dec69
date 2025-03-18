
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GlMapping } from '@/types/glsync';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';

interface SyncProgressIndicatorProps {
  mapping: GlMapping;
}

export function SyncProgressIndicator({ mapping }: SyncProgressIndicatorProps) {
  const { syncStatus, isLoading } = useGlSyncStatus(mapping.id);
  
  const progress = syncStatus && syncStatus.total_records && syncStatus.records_processed 
    ? Math.min(Math.round((syncStatus.records_processed / syncStatus.total_records) * 100), 100) 
    : 0;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse h-6 bg-gray-200 rounded w-full"></div>
        ) : (
          <div className="space-y-2">
            <Progress value={progress} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{syncStatus?.records_processed || 0} processed</span>
              <span>{syncStatus?.total_records || 0} total</span>
            </div>
            {syncStatus?.error_count && syncStatus.error_count > 0 && (
              <div className="text-sm text-destructive mt-2">
                {syncStatus.error_count} error{syncStatus.error_count !== 1 ? 's' : ''} encountered
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
