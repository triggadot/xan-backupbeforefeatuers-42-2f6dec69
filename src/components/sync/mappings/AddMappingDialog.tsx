
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useGlSync } from '@/hooks/useGlSync';
import { GlideTable } from '@/types/glsync';
import { GlideTableSelector } from '@/components/sync/GlideTableSelector';

interface Connection {
  id: string;
  app_name: string;
  app_id: string;
}

interface SupabaseTable {
  table_name: string;
}

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
  // State management
  const [connections, setConnections] = useState<Connection[]>([]);
  const [glideTables, setGlideTables] = useState<GlideTable[]>([]);
  const [supabaseTables, setSupabaseTables] = useState<SupabaseTable[]>([]);
  
  // Loading states
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isLoadingGlideTables, setIsLoadingGlideTables] = useState(false);
  const [isLoadingSupabaseTables, setIsLoadingSupabaseTables] = useState(false);
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
  
  // Fetch data once when dialog is opened
  useEffect(() => {
    if (open) {
      if (connections.length === 0) {
        fetchConnections();
      }
      if (supabaseTables.length === 0) {
        fetchSupabaseTables();
      }
    }
  }, [open]);

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
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  const fetchConnections = async () => {
    if (connections.length > 0) return; // Don't fetch if we already have connections
    
    setIsLoadingConnections(true);
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .select('id, app_name, app_id')
        .order('app_name', { ascending: true });
      
      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load connections',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingConnections(false);
    }
  };

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

  const fetchSupabaseTables = async () => {
    if (supabaseTables.length > 0) return; // Don't fetch if we already have tables
    
    setIsLoadingSupabaseTables(true);
    try {
      const { data, error } = await supabase
        .from('gl_tables_view')
        .select('table_name');
      
      if (error) throw error;
      setSupabaseTables(data || []);
    } catch (error) {
      console.error('Error fetching Supabase tables:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Supabase tables',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSupabaseTables(false);
    }
  };

  const handleConnectionChange = (value: string) => {
    setFormState(prev => ({
      ...prev,
      selectedConnection: value,
      selectedGlideTable: '',
      selectedGlideTableDisplayName: ''
    }));
    loadGlideTables(value);
  };

  const handleGlideTableChange = (tableId: string, displayName: string) => {
    setFormState(prev => ({
      ...prev,
      selectedGlideTable: tableId,
      selectedGlideTableDisplayName: displayName
    }));
    
    console.log(`Selected Glide table: ${tableId} - ${displayName}`);
  };

  const handleSupabaseTableChange = (value: string) => {
    setFormState(prev => ({
      ...prev,
      selectedSupabaseTable: value
    }));
    console.log(`Selected Supabase table: ${value}`);
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

  const handleCloseDialog = (open: boolean) => {
    // Only handle closing, don't reset form state here
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Table Mapping</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="connection">Glide Connection</Label>
            <Select
              value={formState.selectedConnection}
              onValueChange={handleConnectionChange}
              disabled={isLoadingConnections || connections.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a connection" />
              </SelectTrigger>
              <SelectContent>
                {connections.map((connection) => (
                  <SelectItem key={connection.id} value={connection.id}>
                    {connection.app_name || connection.app_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLoadingConnections && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Loading connections...
              </div>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="glideTable">Glide Table</Label>
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
          
          <div className="grid gap-2">
            <Label htmlFor="supabaseTable">Supabase Table</Label>
            <Select
              value={formState.selectedSupabaseTable}
              onValueChange={handleSupabaseTableChange}
              disabled={isLoadingSupabaseTables || supabaseTables.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a Supabase table" />
              </SelectTrigger>
              <SelectContent>
                {supabaseTables.map((table) => (
                  <SelectItem key={table.table_name} value={table.table_name}>
                    {table.table_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLoadingSupabaseTables && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Loading Supabase tables...
              </div>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="syncDirection">Sync Direction</Label>
            <Select
              value={formState.syncDirection}
              onValueChange={handleSyncDirectionChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sync direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="to_supabase">Glide → Supabase</SelectItem>
                <SelectItem value="to_glide">Supabase → Glide</SelectItem>
                <SelectItem value="both">Bidirectional</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Note: For now, only Glide to Supabase syncing is fully supported
            </p>
          </div>
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
