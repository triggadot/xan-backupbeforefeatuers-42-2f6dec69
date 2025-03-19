
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlSync } from '@/hooks/useGlSync';
import { useGlSyncErrors } from '@/hooks/useGlSyncErrors';
import { useGlSyncValidation } from '@/hooks/useGlSyncValidation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { ColumnMappingsView } from './ColumnMappingsView';
import { MappingDetailsCard } from '@/components/sync/MappingDetailsCard';
import { SyncDetailsPanel } from './SyncDetailsPanel';
import { SyncErrorsView } from '@/components/sync/mappings/SyncErrorsView';
import { SyncLogsView } from './SyncLogsView';
import { ValidationDisplay } from '@/components/sync/ValidationDisplay';
import { SyncStatusMessage } from '@/components/sync/SyncStatusMessage';
import { EditTableDialog } from './EditTableDialog';
import { SyncControlPanel } from '@/components/sync/SyncControlPanel';
import { MappingDeleteDialog } from './MappingDeleteDialog';

interface MappingDetailsProps {
  mappingId: string;
  onBack: () => void;
}

const MappingDetails: React.FC<MappingDetailsProps> = ({ mappingId, onBack }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { 
    mapping, 
    isLoading, 
    error, 
    refreshMapping, 
    syncMapping,
    toggleEnabled,
    deleteMapping,
    updateMapping
  } = useGlSync(mappingId);
  
  const { errors, isLoading: isErrorsLoading, refreshErrors } = useGlSyncErrors(mappingId);
  const { validation, isLoading: isValidationLoading, validateMapping } = useGlSyncValidation(mappingId);
  
  const [syncRunning, setSyncRunning] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  
  useEffect(() => {
    refreshMapping();
    refreshErrors();
    validateMapping();
  }, [mappingId, refreshMapping, refreshErrors, validateMapping]);
  
  const handleSync = async () => {
    setSyncRunning(true);
    setSyncResult(null);
    
    try {
      const result = await syncMapping();
      setSyncResult({
        success: result.success,
        message: result.message || (result.success ? 'Sync completed successfully' : 'Sync failed')
      });
    } catch (error) {
      setSyncResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setSyncRunning(false);
      refreshErrors();
    }
  };
  
  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    try {
      await deleteMapping();
      setIsDeleteDialogOpen(false);
      onBack();
    } catch (error) {
      console.error('Error deleting mapping:', error);
    }
  };
  
  const handleEditSubmit = async (updates: any) => {
    try {
      await updateMapping(updates);
      setIsEditDialogOpen(false);
      refreshMapping();
      validateMapping();
      return true;
    } catch (error) {
      console.error('Error updating mapping:', error);
      return false;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error || !mapping) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <p>Error loading mapping: {error || 'Mapping not found'}</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Mappings
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Mappings
        </Button>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              refreshMapping();
              refreshErrors();
              validateMapping();
            }}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      <MappingDetailsCard 
        mapping={mapping} 
        onEdit={handleEdit} 
        onDelete={handleDelete}
        isEnabled={mapping.enabled}
        onToggleEnabled={() => toggleEnabled(mapping)}
      />
      
      {validation && !isValidationLoading && (
        <ValidationDisplay validation={validation} />
      )}
      
      {syncResult && (
        <SyncStatusMessage 
          success={syncResult.success} 
          message={syncResult.message} 
        />
      )}
      
      <SyncControlPanel 
        onSync={handleSync} 
        disabled={syncRunning || isLoading || !mapping.enabled} 
        isRunning={syncRunning}
        isValid={validation?.isValid || false}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="columns">Columns</TabsTrigger>
          <TabsTrigger value="errors">Errors ({errors.length})</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-6">
          <SyncDetailsPanel mapping={mapping} />
        </TabsContent>
        
        <TabsContent value="columns" className="mt-6">
          <ColumnMappingsView 
            mapping={mapping} 
            onUpdate={handleEditSubmit} 
          />
        </TabsContent>
        
        <TabsContent value="errors" className="mt-6">
          <SyncErrorsView 
            errors={errors} 
            isLoading={isErrorsLoading} 
            onRefresh={refreshErrors}
          />
        </TabsContent>
        
        <TabsContent value="logs" className="mt-6">
          <SyncLogsView mappingId={mappingId} />
        </TabsContent>
      </Tabs>
      
      <EditTableDialog 
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        mapping={mapping}
        onSubmit={handleEditSubmit}
      />
      
      <MappingDeleteDialog 
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        mappingName={mapping.glide_table_display_name || mapping.glide_table}
      />
    </div>
  );
};

export default MappingDetails;
