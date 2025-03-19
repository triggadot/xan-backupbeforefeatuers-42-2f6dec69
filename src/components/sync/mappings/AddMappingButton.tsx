
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import AddMappingDialog from './AddMappingDialog';

interface AddMappingButtonProps {
  onSuccess?: () => Promise<void>;
  onMappingAdded?: () => void;
  connectionId?: string;
}

export function AddMappingButton({ onSuccess, onMappingAdded, connectionId }: AddMappingButtonProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = async () => {
    // Call both callbacks if they exist
    if (onSuccess) {
      await onSuccess();
    }
    
    if (onMappingAdded) {
      onMappingAdded();
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Mapping
      </Button>
      
      <AddMappingDialog 
        open={open} 
        onOpenChange={setOpen} 
        onSuccess={onSuccess}
        onMappingAdded={onMappingAdded}
        connectionId={connectionId}
      />
    </>
  );
}
