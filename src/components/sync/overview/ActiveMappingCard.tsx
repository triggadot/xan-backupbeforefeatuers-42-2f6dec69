
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { GlSyncStatus } from '@/types/glsync';
import { SyncStatus } from '../ui/SyncStatus';
import { useNavigate } from 'react-router-dom';

interface ActiveMappingCardProps {
  status: GlSyncStatus;
  onSync: (connectionId: string, mappingId: string) => Promise<void>;
  isSyncing: boolean;
}

export function ActiveMappingCard({ status, onSync, isSyncing }: ActiveMappingCardProps) {
  const navigate = useNavigate();
  
  const getSyncDirectionIcon = () => {
    switch (status.sync_direction) {
      case 'to_supabase':
        return <ArrowDown className="h-4 w-4 mr-1" />;
      case 'to_glide':
        return <ArrowUp className="h-4 w-4 mr-1" />;
      case 'both':
        return <ArrowRightLeft className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  const getSyncDirectionLabel = () => {
    switch (status.sync_direction) {
      case 'to_supabase':
        return 'Glide → Supabase';
      case 'to_glide':
        return 'Supabase → Glide';
      case 'both':
        return 'Bidirectional';
      default:
        return 'Unknown';
    }
  };

  const handleViewDetails = () => {
    navigate(`/sync/mappings?id=${status.mapping_id}`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{status.glide_table_display_name}</CardTitle>
            <div className="text-sm text-muted-foreground">
              {status.supabase_table}
            </div>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            {getSyncDirectionIcon()}
            {getSyncDirectionLabel()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <SyncStatus status={status} />
        
        <div className="flex justify-between gap-2 mt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleViewDetails}
          >
            View Details
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onSync(status.connection_id, status.mapping_id)}
            disabled={isSyncing || status.current_status === 'processing'}
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing
              </>
            ) : (
              'Sync Now'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
