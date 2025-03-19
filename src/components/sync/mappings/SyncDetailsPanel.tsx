
import React from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GlMapping } from '@/types/glsync';
import { formatDate } from '@/utils/date-utils';

interface SyncDetailsPanelProps {
  mapping: GlMapping;
  onSync: () => Promise<void>;
  isSyncing: boolean;
}

const SyncDetailsPanel: React.FC<SyncDetailsPanelProps> = ({ mapping, onSync, isSyncing }) => {
  // Determine sync status icon and color
  const getSyncStatus = () => {
    if (!mapping.current_status) return { icon: <Clock className="h-5 w-5" />, color: 'text-muted-foreground' };
    
    switch (mapping.current_status) {
      case 'completed':
        return { icon: <CheckCircle className="h-5 w-5" />, color: 'text-green-500' };
      case 'failed':
      case 'completed_with_errors':
        return { icon: <AlertTriangle className="h-5 w-5" />, color: 'text-yellow-500' };
      default:
        return { icon: <Clock className="h-5 w-5" />, color: 'text-muted-foreground' };
    }
  };

  const { icon, color } = getSyncStatus();
  const lastSyncDate = mapping.last_sync_completed_at 
    ? formatDate(new Date(mapping.last_sync_completed_at))
    : 'Never';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-md">Sync Status</CardTitle>
          <CardDescription>
            Last synced: {lastSyncDate}
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSync}
          disabled={isSyncing}
          className="ml-auto"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Status</span>
            <div className={`flex items-center gap-2 ${color}`}>
              {icon}
              <span className="font-medium">
                {mapping.current_status ? mapping.current_status.replace(/_/g, ' ') : 'Not synced yet'}
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Records</span>
            <span className="font-medium">{mapping.total_records || 0} total</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Processed</span>
            <span className="font-medium">{mapping.records_processed || 0} records</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Errors</span>
            <span className="font-medium">{mapping.error_count || 0} errors</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncDetailsPanel;
