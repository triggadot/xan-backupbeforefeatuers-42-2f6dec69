import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { CrudDialogBase } from './CrudDialogBase';

interface DeleteConfirmationDialogProps {
  /**
   * The title of the entity being deleted
   */
  title: string;
  
  /**
   * The name or identifier of the entity being deleted
   */
  entityName: string;
  
  /**
   * The type of entity being deleted (e.g., "product", "invoice")
   */
  entityType: string;
  
  /**
   * Whether the dialog is open
   */
  open: boolean;
  
  /**
   * Function to set the open state
   */
  onOpenChange: (open: boolean) => void;
  
  /**
   * Function to call when delete is confirmed
   */
  onConfirmDelete: () => Promise<void>;
  
  /**
   * Whether the delete operation is in progress
   */
  isDeleting: boolean;
  
  /**
   * Optional trigger element
   */
  trigger?: React.ReactNode;
  
  /**
   * Optional message to display about consequences
   */
  consequenceMessage?: string;
}

export const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  title,
  entityName,
  entityType,
  open,
  onOpenChange,
  onConfirmDelete,
  isDeleting,
  trigger,
  consequenceMessage,
}) => {
  return (
    <CrudDialogBase
      title={`Delete ${title}`}
      description={`Are you sure you want to delete this ${entityType}? This action cannot be undone.`}
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      onAction={onConfirmDelete}
      actionLabel="Delete"
      cancelLabel="Cancel"
      isSubmitting={isDeleting}
      maxWidth="sm:max-w-[450px]"
    >
      <div className="py-6">
        <div className="flex items-center gap-4 p-4 mb-4 bg-red-50 rounded-md border border-red-200">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-700">You are about to delete:</p>
            <p className="text-sm text-red-600">{entityName}</p>
          </div>
        </div>
        
        {consequenceMessage && (
          <p className="text-sm text-gray-600 mt-2">{consequenceMessage}</p>
        )}
      </div>
    </CrudDialogBase>
  );
};

export default DeleteConfirmationDialog;
