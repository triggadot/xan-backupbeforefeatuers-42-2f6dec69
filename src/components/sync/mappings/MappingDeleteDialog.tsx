
import React from 'react';
import {
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MappingDeleteDialogProps {
  isDeleting: boolean;
}

export const MappingDeleteDialog: React.FC<MappingDeleteDialogProps> = ({ 
  isDeleting 
}) => {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Deleting Mapping</AlertDialogTitle>
      </AlertDialogHeader>
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-2">Deleting...</span>
      </div>
    </AlertDialogContent>
  );
};
