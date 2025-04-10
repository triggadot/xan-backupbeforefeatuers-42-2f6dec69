import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CrudDialogBaseProps {
  /**
   * Dialog title
   */
  title: string;
  
  /**
   * Optional description below the title
   */
  description?: string;
  
  /**
   * Content of the dialog
   */
  children: React.ReactNode;
  
  /**
   * Trigger element to open the dialog
   */
  trigger: React.ReactNode;
  
  /**
   * Whether the dialog is open
   */
  open: boolean;
  
  /**
   * Function to set the open state
   */
  onOpenChange: (open: boolean) => void;
  
  /**
   * Function to call when the primary action button is clicked
   */
  onAction: () => Promise<void> | void;
  
  /**
   * Label for the primary action button
   */
  actionLabel: string;
  
  /**
   * Label for the cancel button
   */
  cancelLabel?: string;
  
  /**
   * Whether the form is currently submitting
   */
  isSubmitting?: boolean;
  
  /**
   * Whether to disable the action button
   */
  isActionDisabled?: boolean;
  
  /**
   * Maximum width for the dialog content
   */
  maxWidth?: string;
}

export const CrudDialogBase: React.FC<CrudDialogBaseProps> = ({
  title,
  description,
  children,
  trigger,
  open,
  onOpenChange,
  onAction,
  actionLabel,
  cancelLabel = "Cancel",
  isSubmitting = false,
  isActionDisabled = false,
  maxWidth = "sm:max-w-[500px]",
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className={maxWidth}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        {children}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
          <Button 
            onClick={onAction} 
            disabled={isActionDisabled || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              actionLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CrudDialogBase;
