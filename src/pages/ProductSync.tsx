
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGlSyncErrors } from '@/hooks/useGlSyncErrors';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';
import { useGlSyncLogs } from '@/hooks/useGlSyncLogs';
import { MappingDetailsCard } from '@/components/sync/MappingDetailsCard';
import { InvalidMapping } from '@/components/sync/InvalidMapping';
import { LoadingState } from '@/components/sync/LoadingState';
import { MappingTabs } from '@/components/sync/MappingTabs';
import { useProductMapping } from '@/hooks/useProductMapping';
import { GlMapping } from '@/types/glsync';
import { SyncControlPanel } from '@/components/sync/SyncControlPanel';
import { SyncDetailsPanel } from '@/components/sync/SyncDetailsPanel';

const ProductSync = () => {
  const { mappingId = '' } = useParams<{ mappingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { syncErrors, refreshErrors } = useGlSyncErrors(mappingId);
  const { syncStatus, refreshStatus } = useGlSyncStatus(mappingId);
  const { syncLogs, refreshLogs, isLoading: isLoadingLogs } = useGlSyncLogs(mappingId);
  const [hasRowIdMapping, setHasRowIdMapping] = useState(false);
  
  const { 
    mapping, 
    connection, 
    isLoading, 
    refetch 
  } = useProductMapping(mappingId);

  useEffect(() => {
    if (mappingId && mappingId !== ':mappingId') {
      console.log('Fetching mapping with ID:', mappingId);
      refetch();
    }
  }, [mappingId, refetch]);

  useEffect(() => {
    if (mapping) {
      const hasExplicitRowIdMapping = Object.entries(mapping.column_mappings).some(
        ([glideColumnId, mapping]) => glideColumnId === '$rowID' && mapping.supabase_column_name === 'glide_row_id'
      );
      setHasRowIdMapping(hasExplicitRowIdMapping);
    }
  }, [mapping]);

  const handleBackClick = () => {
    navigate('/sync');
  };

  const handleSyncComplete = () => {
    refetch();
    refreshErrors();
    refreshStatus();
    refreshLogs();
  };

  const handleSettingsChange = () => {
    refetch();
  };

  const handleEditMapping = (mapping: GlMapping) => {
    navigate(`/sync/mappings/edit/${mapping.id}`);
  };

  const handleDeleteMapping = async (mappingId: string) => {
    if (window.confirm('Are you sure you want to delete this mapping? This action cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('gl_mappings')
          .delete()
          .eq('id', mappingId);
        
        if (error) throw error;
        
        toast({
          title: 'Mapping deleted',
          description: 'The mapping has been successfully deleted.',
        });
        
        navigate('/sync/mappings');
      } catch (error: any) {
        toast({
          title: 'Error deleting mapping',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  };

  if (!mappingId || mappingId === ':mappingId') {
    return <InvalidMapping onBackClick={handleBackClick} />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (!mapping || !connection) {
    return <InvalidMapping onBackClick={handleBackClick} />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Button variant="ghost" onClick={handleBackClick}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sync
        </Button>
      </div>

      {!hasRowIdMapping && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Row ID Mapping Missing</AlertTitle>
          <AlertDescription>
            No explicit mapping from Glide's <code>$rowID</code> to <code>glide_row_id</code> is defined. 
            The system will automatically use <code>$rowID</code>, but for clarity, consider adding this mapping.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <MappingDetailsCard 
            mapping={mapping} 
            connectionName={connection?.app_name}
            onSyncComplete={handleSyncComplete}
            onEdit={handleEditMapping}
            onDelete={handleDeleteMapping}
            status={syncStatus}
          />
          
          <SyncDetailsPanel 
            status={syncStatus}
            logs={syncLogs}
            isLoadingLogs={isLoadingLogs}
          />
        </div>
        
        <div>
          <SyncControlPanel 
            mapping={mapping}
            status={syncStatus}
            onSyncComplete={handleSyncComplete}
            onSettingsChange={handleSettingsChange}
          />
        </div>
      </div>

      <MappingTabs 
        mapping={mapping}
        syncErrors={syncErrors}
        hasRowIdMapping={hasRowIdMapping}
        onRefreshErrors={refreshErrors}
      />
    </div>
  );
};

export default ProductSync;
