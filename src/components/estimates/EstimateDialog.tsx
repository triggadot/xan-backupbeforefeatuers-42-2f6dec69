
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Estimate } from '@/types/estimate';
import EstimateForm from './EstimateForm';

interface EstimateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Estimate>) => void;
  estimate?: Partial<Estimate>;
  title: string;
}

const EstimateDialog: React.FC<EstimateDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  estimate,
  title
}) => {
  const handleSubmit = (data: Partial<Estimate>) => {
    onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <EstimateForm
          estimate={estimate}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EstimateDialog;
