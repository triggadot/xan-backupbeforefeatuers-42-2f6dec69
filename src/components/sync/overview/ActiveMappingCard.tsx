
import React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2, Database, ExternalLink } from 'lucide-react';
import { formatTimestamp } from '@/utils/glsync-transformers';
import { Link } from 'react-router-dom';
import { GlSyncStatus } from '@/types/glsync';
import { ProgressIndicator } from '../ui/ProgressIndicator';
import { getSyncDirectionIcon, getSyncDirectionLabel } from '../ui/StatusBadgeUtils';

interface ActiveMappingCardProps {
  status: GlSyncStatus;
  onSync: (connectionId: string, mappingId: string) => Promise<void>;
  isSyncing: boolean;
}

export function ActiveMappingCard({ status, onSync, isSyncing }: ActiveMappingCardProps) {
  const handleSync = () => {
    onSync(status.connection_id, status.mapping_id);
  };

  const isProcessing = status.current_status === 'processing' || status.current_status === 'started';
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold">{status.glide_table_display_name}</h3>
              <Badge variant={status.enabled ? 'default' : 'outline'} className={status.enabled ? 'bg-green-500' : ''}>
                {status.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {status.app_name || 'Unnamed App'} • {status.supabase_table}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-sm text-muted-foreground">
              {getSyncDirectionIcon(status.sync_direction)}
              {getSyncDirectionLabel(status.sync_direction)}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Last Sync</p>
            <p className="text-sm font-medium">
              {status.last_sync_completed_at ? formatTimestamp(status.last_sync_completed_at) : 'Never'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="text-sm font-medium capitalize">
              {status.current_status || 'Not synced'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Records</p>
            <p className="text-sm font-medium">
              {status.records_processed !== null ? status.records_processed : 0} / {status.total_records !== null ? status.total_records : '?'}
            </p>
          </div>
        </div>
        
        {isProcessing && (
          <ProgressIndicator 
            current={status.records_processed} 
            total={status.total_records}
            size="sm"
            showText={false}
          />
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/sync/mapping/${status.mapping_id}`}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Details
          </Link>
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleSync}
          disabled={isSyncing || isProcessing}
        >
          {isSyncing || isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isSyncing ? 'Starting...' : 'Processing...'}
            </>
          ) : (
            <>
              Sync Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
