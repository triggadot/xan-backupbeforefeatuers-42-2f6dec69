
import React from 'react';
import { 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface MappingDeleteDialogProps {
  isDeleting: boolean;
  onCancel?: () => void;
  onConfirm?: () => void;
}

export function MappingDeleteDialog({ 
  isDeleting, 
  onCancel, 
  onConfirm 
}: MappingDeleteDialogProps) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete Mapping</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete this mapping? This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onCancel} disabled={isDeleting}>
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            'Delete'
          )}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
