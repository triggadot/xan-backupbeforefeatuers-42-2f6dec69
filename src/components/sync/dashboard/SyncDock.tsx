import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Loader2 } from 'lucide-react';
import { formatLastSyncTime, getLastSyncTime, storeLastSyncTime } from '../utils/syncUtils';

interface SyncDockProps {
  mappingId?: string;
  onSync: () => Promise<void>;
  isSyncing: boolean;
  className?: string;
}

/**
 * SyncDock component provides a control panel for sync operations
 * 
 * This component displays sync status and controls for initiating sync operations
 */
export function SyncDock({ 
  mappingId, 
  onSync, 
  isSyncing, 
  className 
}: SyncDockProps) {
  const lastSyncTime = getLastSyncTime(mappingId);
  const formattedTime = formatLastSyncTime(lastSyncTime);
  
  const handleSync = async () => {
    if (isSyncing) return;
    await onSync();
    
    // Update last sync time
    if (mappingId) {
      storeLastSyncTime(mappingId);
    }
  };
  
  return (
    <Card className={className}>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Last Synced</h3>
          <p className="text-sm text-muted-foreground">{formattedTime}</p>
        </div>
        
        <Button 
          onClick={handleSync} 
          disabled={isSyncing}
          className="gap-2"
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Sync Now
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
