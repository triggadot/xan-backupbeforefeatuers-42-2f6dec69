
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import GlideTableSelector from '@/components/sync/GlideTableSelector';
import { ConnectionSelect } from './ConnectionSelect';
import { SupabaseTableSelect } from './SupabaseTableSelect';
import { SyncDirectionSelect } from './SyncDirectionSelect';
import { useConnections } from '@/hooks/useConnections';
import { useSupabaseTables } from '@/hooks/useSupabaseTables';
import { useGlSync } from '@/hooks/useGlSync';
import { useAddMapping } from '@/hooks/useAddMapping';
import { useColumnMappingSuggestion } from '@/hooks/useColumnMappingSuggestion';
import { useToast } from '@/hooks/use-toast';

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
  const { connections, isLoading: isLoadingConnections, fetchConnections } = useConnections();
  const { tables: supabaseTables, isLoading: isLoadingSupabaseTables, fetchTables: fetchSupabaseTables } = useSupabaseTables();
  const { fetchGlideTables, fetchGlideTableColumns, glideTables, isLoading: isLoadingGlideTables } = useGlSync();
  const { addMapping, isSubmitting } = useAddMapping();
  const { getSuggestions, isLoading: isLoadingSuggestions } = useColumnMappingSuggestion();
  const { toast } = useToast();
  
  // Form state
  const [selectedConnection, setSelectedConnection] = useState('');
  const [selectedGlideTable, setSelectedGlideTable] = useState('');
  const [selectedGlideTableDisplayName, setSelectedGlideTableDisplayName] = useState('');
  const [selectedSupabaseTable, setSelectedSupabaseTable] = useState('');
  const [syncDirection, setSyncDirection] = useState<'to_supabase' | 'to_glide' | 'both'>('to_supabase');
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  
  // Fetch data when dialog is opened
  useEffect(() => {
    if (open) {
      fetchConnections();
      fetchSupabaseTables();
    }
  }, [open]);
  
  // Fetch glide tables when connection changes
  useEffect(() => {
    if (selectedConnection) {
      fetchGlideTables(selectedConnection);
    }
  }, [selectedConnection]);

  // Reset form when dialog is closed
  useEffect(() => {
    if (!open) {
      setSelectedConnection('');
      setSelectedGlideTable('');
      setSelectedGlideTableDisplayName('');
      setSelectedSupabaseTable('');
      setSyncDirection('to_supabase');
    }
  }, [open]);

  const handleConnectionChange = (value: string) => {
    setSelectedConnection(value);
    setSelectedGlideTable('');
    setSelectedGlideTableDisplayName('');
  };

  const handleGlideTableChange = (tableId: string, displayName: string) => {
    setSelectedGlideTable(tableId);
    setSelectedGlideTableDisplayName(displayName);
  };

  const handleSupabaseTableChange = (value: string) => {
    setSelectedSupabaseTable(value);
  };
  
  const handleSyncDirectionChange = (value: 'to_supabase' | 'to_glide' | 'both') => {
    setSyncDirection(value);
  };

  const isFormValid = () => {
    return Boolean(selectedConnection && selectedGlideTable && selectedSupabaseTable);
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before submitting",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (selectedGlideTable && selectedSupabaseTable) {
        // If we're creating with automatic column mapping suggestions
        setIsGeneratingSuggestions(true);
        
        // Get Glide table columns
        const columnsResponse = await fetchGlideTableColumns(selectedConnection, selectedGlideTable);
        
        if ('columns' in columnsResponse) {
          // Get mapping suggestions
          const suggestions = await getSuggestions(selectedSupabaseTable, columnsResponse.columns);
          
          // Create mapping with the suggestions
          const success = await addMapping(
            selectedConnection,
            selectedGlideTable,
            selectedGlideTableDisplayName,
            selectedSupabaseTable,
            syncDirection,
            suggestions  // Pass the suggestions to use as initial mappings
          );
          
          if (success) {
            onSuccess();
            onOpenChange(false);
          }
        } else {
          // Fall back to basic mapping if we couldn't get columns
          const success = await addMapping(
            selectedConnection,
            selectedGlideTable,
            selectedGlideTableDisplayName,
            selectedSupabaseTable,
            syncDirection
          );
          
          if (success) {
            onSuccess();
            onOpenChange(false);
          }
        }
      } else {
        // Basic mapping without suggestions
        const success = await addMapping(
          selectedConnection,
          selectedGlideTable,
          selectedGlideTableDisplayName,
          selectedSupabaseTable,
          syncDirection
        );
        
        if (success) {
          onSuccess();
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error("Error creating mapping:", error);
      toast({
        title: "Error",
        description: "Failed to create the mapping. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSuggestions(false);
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
            value={selectedConnection}
            onValueChange={handleConnectionChange}
            isLoading={isLoadingConnections}
          />
          
          <div className="grid gap-2">
            <GlideTableSelector
              tables={glideTables}
              value={selectedGlideTable}
              onTableChange={handleGlideTableChange}
              disabled={isLoadingGlideTables || !selectedConnection}
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
            value={selectedSupabaseTable}
            onValueChange={handleSupabaseTableChange}
            isLoading={isLoadingSupabaseTables}
          />
          
          <SyncDirectionSelect 
            value={syncDirection}
            onValueChange={handleSyncDirectionChange}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isGeneratingSuggestions || !isFormValid()}
          >
            {isSubmitting || isGeneratingSuggestions ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isGeneratingSuggestions ? 'Analyzing Tables...' : 'Adding...'}
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
