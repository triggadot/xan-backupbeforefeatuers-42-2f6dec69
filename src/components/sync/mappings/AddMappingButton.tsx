
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { AddMappingForm } from './AddMappingForm';

interface AddMappingButtonProps {
  onSuccess?: () => Promise<void>;
}

export function AddMappingButton({ onSuccess }: AddMappingButtonProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = async () => {
    setOpen(false);
    if (onSuccess) {
      await onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Mapping
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Table Mapping</DialogTitle>
          <DialogDescription>
            Map a Glide table to a Supabase table for synchronization.
          </DialogDescription>
        </DialogHeader>
        <AddMappingForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
