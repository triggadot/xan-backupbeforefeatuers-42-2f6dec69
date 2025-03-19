
import React, { useState } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ConnectionSelect } from './ConnectionSelect';
import { CreateTableForm } from './CreateTableForm';
import { GlConnection } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';
import { GlideTableSelector } from '@/components/sync/GlideTableSelector';

// Form schema using zod for validation
const schemaSetupSchema = z.object({
  connection_id: z.string().min(1, 'Connection is required'),
  glide_table: z.string().min(1, 'Glide table is required'),
});

type SchemaSetupFormValues = z.infer<typeof schemaSetupSchema>;

interface SchemaSetupDialogProps {
  onClose: () => void;
  onSchemaCreated?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  connectionId?: string;
  onSuccess?: () => void;
}

const SchemaSetupDialog: React.FC<SchemaSetupDialogProps> = ({ 
  onClose, 
  onSchemaCreated,
  open,
  onOpenChange,
  connectionId,
  onSuccess 
}) => {
  const [activeTab, setActiveTab] = useState('sync-table');
  const [selectedConnection, setSelectedConnection] = useState<GlConnection | null>(null);
  const [selectedGlideTable, setSelectedGlideTable] = useState<string | null>(null);
  const [selectedGlideTableName, setSelectedGlideTableName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize the form
  const form = useForm<SchemaSetupFormValues>({
    resolver: zodResolver(schemaSetupSchema),
    defaultValues: {
      connection_id: connectionId || '',
      glide_table: '',
    },
  });

  // Handle connection selection
  const handleConnectionSelect = (connection: GlConnection) => {
    setSelectedConnection(connection);
    form.setValue('connection_id', connection.id);
  };

  // Handle Glide table selection
  const handleGlideTableSelect = (tableId: string, displayName: string) => {
    setSelectedGlideTable(tableId);
    setSelectedGlideTableName(displayName);
    form.setValue('glide_table', tableId);
  };

  // Handle form submission to get column data
  const handleSubmit = async (values: SchemaSetupFormValues) => {
    setIsLoading(true);
    try {
      // Now we have the connection and Glide table, let's create the schema
      setActiveTab('create-table');
    } catch (error) {
      console.error('Error getting table columns:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get table columns',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sync-table">Select Table</TabsTrigger>
          <TabsTrigger value="create-table" disabled={!selectedGlideTable}>Create Schema</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sync-table" className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="connection_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Connection</FormLabel>
                    <FormControl>
                      <ConnectionSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        onConnectionSelect={handleConnectionSelect}
                        selectedConnectionId={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="glide_table"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Glide Table</FormLabel>
                    <FormControl>
                      <GlideTableSelector
                        value={field.value}
                        onTableChange={field.onChange}
                        connectionId={form.getValues('connection_id')}
                        disabled={!form.getValues('connection_id')}
                        onTableSelect={handleGlideTableSelect}
                        selectedTableId={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={onClose} type="button">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !form.formState.isValid}>
                  {isLoading ? 'Loading...' : 'Next'}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="create-table" className="py-4">
          {selectedConnection && selectedGlideTable && (
            <CreateTableForm
              connectionId={selectedConnection.id}
              glideTable={selectedGlideTable}
              glideTableDisplayName={selectedGlideTableName || selectedGlideTable}
              onCancel={() => setActiveTab('sync-table')}
              onSuccess={() => {
                toast({
                  title: 'Success',
                  description: 'Table schema created successfully',
                });
                onSchemaCreated?.();
                if (onSuccess) {
                  onSuccess();
                }
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SchemaSetupDialog;
