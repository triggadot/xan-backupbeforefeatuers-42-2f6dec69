
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGlSync } from '@/hooks/useGlSync';
import { GlideTable } from '@/types/glsync';
import { GlideTableSelector } from '@/components/sync/GlideTableSelector';
import { ConnectionSelect } from './ConnectionSelect';
import { SupabaseTableSelect } from './SupabaseTableSelect';
import { SyncDirectionSelect } from './SyncDirectionSelect';
import { useConnections } from '@/hooks/useConnections';
import { useSupabaseTables } from '@/hooks/useSupabaseTables';

interface AddMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddMappingDialog: React.FC<AddMappingDialogProps> = ({ 
  open, 
  onOpenChange,
  onSuccess 
}) => {
  // Custom hooks for data fetching
  const { connections, isLoading: isLoadingConnections } = useConnections();
  const { tables: supabaseTables, isLoading: isLoadingSupabaseTables } = useSupabaseTables();
  
  // State management
  const [glideTables, setGlideTables] = useState<GlideTable[]>([]);
  const [isLoadingGlideTables, setIsLoadingGlideTables] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formState, setFormState] = useState({
    selectedConnection: '',
    selectedGlideTable: '',
    selectedGlideTableDisplayName: '',
    selectedSupabaseTable: '',
    syncDirection: 'to_supabase' as 'to_supabase' | 'to_glide' | 'both'
  });
  
  // Hooks
  const { toast } = useToast();
  const { fetchGlideTables } = useGlSync();
  
  // Fetch data when dialog is opened and connection is selected
  useEffect(() => {
    if (open && formState.selectedConnection) {
      loadGlideTables(formState.selectedConnection);
    }
  }, [open, formState.selectedConnection]);

  // Reset form when dialog is closed
  useEffect(() => {
    if (!open) {
      // Wait for dialog animation to complete before resetting
      const timeoutId = setTimeout(() => {
        setFormState({
          selectedConnection: '',
          selectedGlideTable: '',
          selectedGlideTableDisplayName: '',
          selectedSupabaseTable: '',
          syncDirection: 'to_supabase'
        });
        setGlideTables([]);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  const loadGlideTables = async (connectionId: string) => {
    if (!connectionId) return;
    
    setIsLoadingGlideTables(true);
    
    try {
      const result = await fetchGlideTables(connectionId);
      
      if (result.tables) {
        setGlideTables(result.tables);
      } else {
        setGlideTables([]);
        toast({
          title: 'Warning',
          description: result.error || 'No Glide tables found',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading Glide tables:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Glide tables',
        variant: 'destructive',
      });
      setGlideTables([]);
    } finally {
      setIsLoadingGlideTables(false);
    }
  };

  const handleConnectionChange = (value: string) => {
    setFormState(prev => ({
      ...prev,
      selectedConnection: value,
      selectedGlideTable: '',
      selectedGlideTableDisplayName: ''
    }));
  };

  const handleGlideTableChange = (tableId: string, displayName: string) => {
    setFormState(prev => ({
      ...prev,
      selectedGlideTable: tableId,
      selectedGlideTableDisplayName: displayName
    }));
  };

  const handleSupabaseTableChange = (value: string) => {
    setFormState(prev => ({
      ...prev,
      selectedSupabaseTable: value
    }));
  };
  
  const handleSyncDirectionChange = (value: 'to_supabase' | 'to_glide' | 'both') => {
    setFormState(prev => ({
      ...prev,
      syncDirection: value
    }));
  };

  const isFormValid = () => {
    const { selectedConnection, selectedGlideTable, selectedSupabaseTable } = formState;
    return Boolean(selectedConnection && selectedGlideTable && selectedSupabaseTable);
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast({
        title: 'Validation Error',
        description: 'Please select a connection, Glide table, and Supabase table',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create default column mapping with $rowID to glide_row_id
      const defaultColumnMappings = {
        '$rowID': {
          glide_column_name: '$rowID',
          supabase_column_name: 'glide_row_id',
          data_type: 'string'
        }
      };
      
      // Create the mapping
      const { error } = await supabase
        .from('gl_mappings')
        .insert({
          connection_id: formState.selectedConnection,
          glide_table: formState.selectedGlideTable,
          glide_table_display_name: formState.selectedGlideTableDisplayName,
          supabase_table: formState.selectedSupabaseTable,
          column_mappings: defaultColumnMappings,
          sync_direction: formState.syncDirection,
          enabled: true
        });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Mapping created successfully',
      });
      
      onSuccess();
      
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding mapping:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add mapping',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Table Mapping</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <ConnectionSelect 
            connections={connections}
            value={formState.selectedConnection}
            onValueChange={handleConnectionChange}
            isLoading={isLoadingConnections}
          />
          
          <div className="grid gap-2">
            <GlideTableSelector
              tables={glideTables}
              value={formState.selectedGlideTable}
              onTableChange={handleGlideTableChange}
              disabled={isLoadingGlideTables || !formState.selectedConnection}
              isLoading={isLoadingGlideTables}
              placeholder="Select a Glide table"
            />
            {isLoadingGlideTables && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Loading Glide tables...
              </div>
            )}
          </div>
          
          <SupabaseTableSelect 
            tables={supabaseTables}
            value={formState.selectedSupabaseTable}
            onValueChange={handleSupabaseTableChange}
            isLoading={isLoadingSupabaseTables}
          />
          
          <SyncDirectionSelect 
            value={formState.syncDirection}
            onValueChange={handleSyncDirectionChange}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !isFormValid()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Mapping'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddMappingDialog;
