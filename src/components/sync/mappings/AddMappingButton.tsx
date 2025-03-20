
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import AddMappingDialog from './AddMappingDialog';

interface AddMappingButtonProps {
  onSuccess?: () => Promise<void>;
}

export function AddMappingButton({ onSuccess }: AddMappingButtonProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = async () => {
    if (onSuccess) {
      await onSuccess();
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
        onSuccess={handleSuccess} 
      />
    </>
  );
}
