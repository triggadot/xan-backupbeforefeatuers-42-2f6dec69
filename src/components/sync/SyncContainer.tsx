
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlMapping, ProductSyncResult } from '@/types/glsync';
import { SyncProgressIndicator } from './SyncProgressIndicator';
import { SyncStatusMessage } from './SyncStatusMessage';
import { useSyncData } from '@/hooks/useSyncData';

interface SyncContainerProps {
  mapping: GlMapping;
  onSyncComplete?: () => void;
}

export function SyncContainer({ mapping, onSyncComplete }: SyncContainerProps) {
  const { syncData, isLoading } = useSyncData();
  const [syncResult, setSyncResult] = useState<ProductSyncResult | null>(null);
  const [progress, setProgress] = useState(0);

  const handleSync = async () => {
    if (!mapping.enabled) return;
    
    setSyncResult(null);
    setProgress(0);
    
    const result = await syncData(mapping.connection_id, mapping.id);
    setSyncResult(result);
    
    if (result.success) {
      setProgress(100);
    }
    
    if (onSyncComplete) {
      onSyncComplete();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Sync {mapping.glide_table_display_name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SyncProgressIndicator 
          progress={progress}
          isLoading={isLoading}
          total={syncResult?.total_records}
          processed={syncResult?.processed_records}
        />
        
        {syncResult && (
          <SyncStatusMessage
            success={syncResult.success}
            message={syncResult.error || 'Sync completed successfully'}
            recordsProcessed={syncResult.recordsProcessed}
            failedRecords={syncResult.failedRecords}
          />
        )}
        
        <div className="flex justify-end">
          <Button 
            onClick={handleSync}
            disabled={isLoading || !mapping.enabled}
          >
            Sync Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
