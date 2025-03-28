
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { formatTimestamp } from '@/utils/date-utils';
import { StatusBadge, getStatusIcon } from '../ui/StatusBadgeUtils';
import { GlSyncStatus } from '@/types/glsync';
import { ProgressIndicator } from '../ui/ProgressIndicator';

interface ActiveMappingCardProps {
  status: GlSyncStatus;
  onSync: (connectionId: string, mappingId: string) => Promise<void>;
  isSyncing: boolean;
}

export function ActiveMappingCard({ status, onSync, isSyncing }: ActiveMappingCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-medium">
              {status.glide_table_display_name}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {status.app_name} → {status.supabase_table}
            </div>
          </div>
          <div className="flex items-center">
            <StatusBadge status={status.current_status || 'pending'} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="text-sm mt-2 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <div className="flex items-center gap-1">
              {getStatusIcon(status.current_status)}
              <span>
                {status.current_status
                  ? status.current_status.charAt(0).toUpperCase() + status.current_status.slice(1)
                  : 'Not synced'}
              </span>
            </div>
          </div>
          
          <ProgressIndicator 
            current={status.records_processed} 
            total={status.total_records} 
          />
          
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Last sync: {formatTimestamp(status.last_sync_completed_at)}
            </div>
            <div className="flex space-x-2">
              <Link to={
                status.supabase_table === 'gl_products' 
                  ? `/sync/products/${status.mapping_id}` 
                  : `/sync/mappings/${status.mapping_id}`
              }>
                <Button 
                  size="sm"
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Details
                </Button>
              </Link>
              <Button 
                size="sm"
                onClick={() => onSync(status.connection_id, status.mapping_id)}
                disabled={isSyncing || status.current_status === 'processing'}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
