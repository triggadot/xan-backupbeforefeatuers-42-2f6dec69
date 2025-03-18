
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DeleteMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapping: {
    id: string;
    glide_table_display_name?: string;
    glide_table?: string;
    supabase_table?: string;
  };
  onSuccess: () => void;
}

const DeleteMappingDialog: React.FC<DeleteMappingDialogProps> = ({ 
  open, 
  onOpenChange,
  mapping,
  onSuccess 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete the mapping
      const { error } = await supabase
        .from('gl_mappings')
        .delete()
        .eq('id', mapping.id);
      
      if (error) throw error;
      
      onSuccess();
      toast({
        title: 'Mapping deleted',
        description: 'Mapping has been deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete mapping',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      onOpenChange(false);
    }
  };

  const displayName = mapping.glide_table_display_name || mapping.glide_table || 'this mapping';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Mapping</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the mapping for "{displayName}"?
            This will stop any synchronization between Glide and Supabase for this table.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-600"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteMappingDialog;
