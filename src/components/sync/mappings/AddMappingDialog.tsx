
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddMappingForm from './AddMappingForm';
import SchemaSetupDialog from './SchemaSetupDialog';
import ConnectionSelect from './ConnectionSelect';
import { GlConnection } from '@/types/glsync';
import { GlideTableSelector } from '@/components/sync/GlideTableSelector';

interface AddMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMappingAdded?: () => void;
  connectionId?: string;
}

const AddMappingDialog: React.FC<AddMappingDialogProps> = ({ 
  open, 
  onOpenChange,
  onMappingAdded,
  connectionId
}) => {
  const [activeTab, setActiveTab] = React.useState('add-mapping');
  const [selectedConnection, setSelectedConnection] = React.useState<GlConnection | null>(null);

  React.useEffect(() => {
    // Reset tab when dialog is opened
    if (open) {
      setActiveTab('add-mapping');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Mapping</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add-mapping">Map Tables</TabsTrigger>
            <TabsTrigger value="create-schema">Create Schema</TabsTrigger>
          </TabsList>
          
          <TabsContent value="add-mapping" className="py-4">
            <AddMappingForm 
              onMappingAdded={onMappingAdded} 
              onClose={() => onOpenChange(false)}
              preselectedConnectionId={connectionId}
            />
          </TabsContent>
          
          <TabsContent value="create-schema" className="py-4">
            <SchemaSetupDialog 
              onClose={() => onOpenChange(false)}
              onSchemaCreated={() => setActiveTab('add-mapping')} 
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddMappingDialog;
