
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ColumnMappingsView from './ColumnMappingsView';
import SyncDetailsPanel from './SyncDetailsPanel';
import { glSyncApi } from '@/services/glsync';
import { useQuery } from '@tanstack/react-query';
import { useRealtimeMappings } from '@/hooks/useRealtimeMappings';
import { useRealtimeSyncLogs } from '@/hooks/useRealtimeSyncLogs';
import { SyncLogTable } from '@/components/sync/ui/SyncLogTable';
import { useToast } from '@/hooks/use-toast';
import SyncErrorsView from './SyncErrorsView';

interface MappingDetailsProps {
  mappingId: string;
  onBack: () => void;
}

const MappingDetails: React.FC<MappingDetailsProps> = ({ mappingId, onBack }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const mappingsState = useRealtimeMappings();
  const { data: syncLogs } = useRealtimeSyncLogs({ limit: 10, mappingId });

  // Fetch individual mapping details
  const { data: mapping, isLoading, refetch } = useQuery({
    queryKey: ['mapping', mappingId],
    queryFn: async () => {
      const response = await glSyncApi.getMappingById(mappingId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to load mapping');
      }
      return response.mapping;
    }
  });

  // Also fetch connection details
  const { data: connection } = useQuery({
    queryKey: ['connection', mapping?.connection_id],
    queryFn: async () => {
      if (!mapping?.connection_id) return null;
      const response = await glSyncApi.getConnectionById(mapping.connection_id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to load connection');
      }
      return response.connection;
    },
    enabled: !!mapping?.connection_id
  });

  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const result = await glSyncApi.syncData(mapping?.connection_id || '', mappingId);
      
      if (!result.success) {
        throw new Error(result.error || 'Sync failed');
      }
      
      toast({
        title: 'Sync Started',
        description: `Processing ${result.recordsProcessed || 0} records.`,
      });
      
      // Refresh data
      refetch();
    } catch (error) {
      toast({
        title: 'Sync Error',
        description: error instanceof Error ? error.message : 'An error occurred during sync',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading || !mapping) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">Loading mapping details...</h2>
        </div>
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded mb-4"></div>
          <div className="h-64 bg-muted rounded mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">{mapping.glide_table_display_name || 'Mapping Details'}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SyncDetailsPanel 
            mapping={mapping} 
            onSync={handleSync} 
            isSyncing={isSyncing} 
          />
          
          <ColumnMappingsView mapping={mapping} />
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <SyncErrorsView mappingId={mappingId} />
            
            <div className="bg-card border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Recent Sync Logs</h3>
              <SyncLogTable logs={syncLogs?.logs || []} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MappingDetails;
