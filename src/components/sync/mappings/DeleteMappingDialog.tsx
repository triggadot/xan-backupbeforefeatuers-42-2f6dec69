import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Mapping } from '@/types/syncLog';

export interface DeleteMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapping: Mapping;
  onSuccess: () => void;
  onDelete: () => Promise<void>;
}

const DeleteMappingDialog: React.FC<DeleteMappingDialogProps> = ({
  open,
  onOpenChange,
  mapping,
  onSuccess,
  onDelete
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      onSuccess();
    } catch (error) {
      console.error('Error deleting mapping:', error);
    } finally {
      setIsDeleting(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <VisuallyHidden>
          <DialogTitle>Delete Mapping Confirmation</DialogTitle>
        </VisuallyHidden>
        <DialogHeader>
          <DialogDescription>
            Are you sure you want to delete this mapping? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p><strong>Table:</strong> {mapping.glide_table_display_name || mapping.glide_table} → {mapping.supabase_table}</p>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Mapping'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteMappingDialog;
