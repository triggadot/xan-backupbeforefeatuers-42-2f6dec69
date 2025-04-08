import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GlMapping, GlSyncStatus } from '@/types/glsync';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';
import { useGlSync } from '@/hooks/useGlSync';
import { ProgressIndicator } from './ui/ProgressIndicator';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface SyncProgressIndicatorProps {
  mapping: GlMapping;
  status?: GlSyncStatus;
}

export const SyncProgressIndicator: React.FC<SyncProgressIndicatorProps> = ({ 
  mapping,
  status: initialStatus 
}) => {
  // State declarations
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Hooks
  const { syncStatus } = useGlSyncStatus(mapping.id);
  const { syncData } = useGlSync();
  const { toast } = useToast();

  // Handle sync button click
  const handleSync = async () => {
    if (isSyncing || syncStatus?.current_status === 'processing') return;
    
    setIsSyncing(true);
    try {
      const result = await syncData(mapping.connection_id, mapping.id);
      
      if (result) {
        toast({
          title: 'Sync started',
          description: 'The synchronization process has been initiated.',
        });
      } else {
        toast({
          title: 'Sync failed',
          description: 'An unknown error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Return/render component
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Sync Progress</CardTitle>
          <Button 
            size="sm"
            variant="default"
            className="h-8 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleSync}
            disabled={isSyncing || syncStatus?.current_status === 'processing'}
          >
            {isSyncing || syncStatus?.current_status === 'processing' ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Sync Now
              </>
            )}
          </Button>
        </div>
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
