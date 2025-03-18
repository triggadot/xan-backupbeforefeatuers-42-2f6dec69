
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useConnections } from '@/hooks/useConnections';
import { useSupabaseTables } from '@/hooks/useSupabaseTables';
import MappingFormContainer from './MappingFormContainer';
import { SupabaseTable } from '@/types/syncLog';

interface AddMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddMappingDialog = ({ 
  open, 
  onOpenChange,
  onSuccess 
}: AddMappingDialogProps) => {
  const { connections, isLoading: isLoadingConnections, fetchConnections } = useConnections();
  const { tables: supabaseTables, isLoading: isLoadingSupabaseTables, fetchTables: fetchSupabaseTables } = useSupabaseTables();
  
  // Fetch data when dialog is opened
  useEffect(() => {
    if (open) {
      fetchConnections();
      fetchSupabaseTables();
    }
  }, [open]);

  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  // Extract table names for the form
  const tableNames = supabaseTables.map(table => table.table_name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Mapping</DialogTitle>
        </DialogHeader>
        <MappingFormContainer
          isEditing={false}
          connections={connections}
          supabaseTables={tableNames}
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddMappingDialog;
