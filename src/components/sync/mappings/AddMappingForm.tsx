
import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import ConnectionSelect from './ConnectionSelect';
import SupabaseTableSelect from './SupabaseTableSelect';
import SyncDirectionSelect from './SyncDirectionSelect';
import { GlConnection } from '@/types/glsync';
import { useAddMapping } from '@/hooks/useAddMapping';
import { getDefaultColumnMappings } from '@/utils/gl-mapping-converters';
import { useToast } from '@/hooks/use-toast';
import { GlideTableSelector } from '@/components/sync/GlideTableSelector';
import { glSyncApi } from '@/services/glsync';

// Form schema
const formSchema = z.object({
  connection_id: z.string().min(1, { message: 'Connection is required' }),
  glide_table: z.string().min(1, { message: 'Glide table is required' }),
  glide_table_display_name: z.string().optional(),
  supabase_table: z.string().min(1, { message: 'Supabase table is required' }),
  sync_direction: z.enum(['to_supabase', 'to_glide', 'both']).default('to_supabase'),
});

type FormValues = z.infer<typeof formSchema>;

interface AddMappingFormProps {
  onMappingAdded?: () => void;
  onClose: () => void;
  preselectedConnectionId?: string;
}

const AddMappingForm: React.FC<AddMappingFormProps> = ({ 
  onMappingAdded, 
  onClose,
  preselectedConnectionId 
}) => {
  const [selectedConnection, setSelectedConnection] = useState<GlConnection | null>(null);
  const [selectedGlideTable, setSelectedGlideTable] = useState<string | null>(null);
  const [selectedGlideTableName, setSelectedGlideTableName] = useState<string | null>(null);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [glideTables, setGlideTables] = useState<{ id: string, name: string }[]>([]);
  const [tableError, setTableError] = useState<string | null>(null);
  
  const { addMapping, isSubmitting } = useAddMapping();
  const { toast } = useToast();

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      connection_id: preselectedConnectionId || '',
      glide_table: '',
      glide_table_display_name: '',
      supabase_table: '',
      sync_direction: 'to_supabase',
    },
  });

  // Fetch Glide tables when connection changes
  useEffect(() => {
    const fetchGlideTables = async (connectionId: string) => {
      if (!connectionId) return;
      
      setIsLoadingTables(true);
      setTableError(null);
      
      try {
        const response = await glSyncApi.listGlideTables(connectionId);
        
        if (response.success) {
          setGlideTables(response.tables);
        } else {
          setTableError(response.error || 'Failed to load Glide tables');
          toast({
            title: 'Error',
            description: response.error || 'Failed to load Glide tables',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching Glide tables:', error);
        setTableError(error instanceof Error ? error.message : 'An error occurred');
        
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load Glide tables',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingTables(false);
      }
    };

    const connectionId = form.getValues('connection_id');
    if (connectionId) {
      fetchGlideTables(connectionId);
    }
  }, [form.watch('connection_id')]);

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
    form.setValue('glide_table_display_name', displayName);
  };

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      const success = await addMapping(
        values.connection_id,
        values.glide_table,
        values.glide_table_display_name || values.glide_table,
        values.supabase_table,
        values.sync_direction,
        getDefaultColumnMappings()
      );
      
      if (success) {
        onMappingAdded?.();
        onClose();
      }
    } catch (error) {
      console.error('Error adding mapping:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add mapping',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="connection_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Connection</FormLabel>
              <FormControl>
                <ConnectionSelect
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
                  connectionId={form.getValues('connection_id')}
                  disabled={!form.getValues('connection_id') || isLoadingTables}
                  onTableSelect={handleGlideTableSelect}
                  selectedTableId={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="supabase_table"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supabase Table</FormLabel>
              <FormControl>
                <SupabaseTableSelect
                  onTableSelect={(table) => form.setValue('supabase_table', table)}
                  selectedTable={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sync_direction"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sync Direction</FormLabel>
              <FormControl>
                <SyncDirectionSelect
                  value={field.value}
                  onChange={(value) => form.setValue('sync_direction', value as 'to_supabase' | 'to_glide' | 'both')}
                />
              </FormControl>
              <FormMessage />
              <div className="text-xs text-muted-foreground mt-1">
                Choose how data should sync between Glide and Supabase
              </div>
            </FormItem>
          )}
        />

        <Alert variant="info" className="mt-6">
          <InfoCircledIcon className="h-4 w-4" />
          <AlertDescription>
            After creating the mapping, you'll be able to configure column mappings.
          </AlertDescription>
        </Alert>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Mapping'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddMappingForm;
