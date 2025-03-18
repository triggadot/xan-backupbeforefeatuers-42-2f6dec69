import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { formatTimestamp } from '@/utils/glsync-transformers';
import { getStatusBadge, getStatusIcon } from '../ui/StatusBadgeUtils';
import { GlSyncStatus } from '@/types/glsync';

interface ActiveMappingCardProps {
  status: GlSyncStatus;
  onSync: (connectionId: string, mappingId: string) => Promise<void>;
  isSyncing: boolean;
}

export function ActiveMappingCard({ status, onSync, isSyncing }: ActiveMappingCardProps) {
  const calculateProgress = () => {
    if (!status.total_records || !status.records_processed) return 0;
    return Math.min(Math.round((status.records_processed / status.total_records) * 100), 100);
  };

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
            {getStatusBadge(status.current_status)}
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
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sync Progress</span>
              <span>
                {status.records_processed || 0} / {status.total_records || '?'}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full">
              <div 
                className="h-2 bg-blue-500 rounded-full" 
                style={{ 
                  width: `${status.total_records && status.records_processed 
                    ? Math.min(Math.round((status.records_processed / status.total_records) * 100), 100) 
                    : 0}%` 
                }}>
              </div>
            </div>
          </div>
          
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