
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import SchemaSetupDialog from './SchemaSetupDialog';
import { useToast } from '@/hooks/use-toast';

interface CreateSchemaButtonProps {
  connectionId: string;
  onTableCreated?: () => void;
}

export const CreateSchemaButton: React.FC<CreateSchemaButtonProps> = ({ 
  connectionId,
  onTableCreated
}) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      title: 'Success',
      description: 'Table created successfully'
    });
    
    if (onTableCreated) {
      onTableCreated();
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
      >
        <PlusCircle className="h-4 w-4" />
        Create Table Schema
      </Button>
      
      <SchemaSetupDialog 
        open={open}
        onOpenChange={setOpen}
        connectionId={connectionId}
        onSuccess={handleSuccess}
      />
    </>
  );
};
