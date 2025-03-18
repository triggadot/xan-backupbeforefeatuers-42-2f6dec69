
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
import { GlConnection } from '@/types/glsync';

interface DeleteConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: GlConnection;
  onSuccess: () => void;
}

const DeleteConnectionDialog: React.FC<DeleteConnectionDialogProps> = ({ 
  open, 
  onOpenChange,
  connection,
  onSuccess 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Check if there are any mappings using this connection
      const { data: mappings, error: mappingsError } = await supabase
        .from('gl_mappings')
        .select('id')
        .eq('connection_id', connection.id);
      
      if (mappingsError) throw mappingsError;
      
      if (mappings && mappings.length > 0) {
        // Delete all mappings for this connection
        const { error: deleteMappingsError } = await supabase
          .from('gl_mappings')
          .delete()
          .eq('connection_id', connection.id);
        
        if (deleteMappingsError) throw deleteMappingsError;
      }
      
      // Delete the connection
      const { error } = await supabase
        .from('gl_connections')
        .delete()
        .eq('id', connection.id);
      
      if (error) throw error;
      
      onSuccess();
    } catch (error) {
      console.error('Error deleting connection:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete connection',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Connection</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the connection "{connection.app_name || 'Unnamed App'}"?
            This will also delete all mappings associated with this connection.
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

export default DeleteConnectionDialog;
