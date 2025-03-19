
import React, { useState, useEffect } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ConnectionSelect } from './ConnectionSelect';
import { SupabaseTableSelect } from './SupabaseTableSelect';
import { SyncDirectionSelect } from './SyncDirectionSelect';
import { GlConnection, GlMapping } from '@/types/glsync';
import { getDefaultColumnMappings } from '@/utils/gl-mapping-converters';
import { GlideTableSelector } from '@/components/sync/GlideTableSelector';

// Form schema using zod for validation
const mappingFormSchema = z.object({
  connection_id: z.string().min(1, 'Connection is required'),
  glide_table: z.string().min(1, 'Glide table is required'),
  glide_table_display_name: z.string().optional(),
  supabase_table: z.string().min(1, 'Supabase table is required'),
  sync_direction: z.enum(['to_supabase', 'to_glide', 'both']).default('to_supabase'),
});

type MappingFormValues = z.infer<typeof mappingFormSchema>;

interface MappingFormProps {
  initialValues?: Partial<GlMapping>;
  onSubmit: (values: MappingFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const MappingForm: React.FC<MappingFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [selectedConnection, setSelectedConnection] = useState<GlConnection | null>(null);
  const [selectedGlideTable, setSelectedGlideTable] = useState<string | null>(null);
  const [selectedGlideTableName, setSelectedGlideTableName] = useState<string | null>(null);

  // Initialize the form with default values or passed in values
  const form = useForm<MappingFormValues>({
    resolver: zodResolver(mappingFormSchema),
    defaultValues: {
      connection_id: initialValues?.connection_id || '',
      glide_table: initialValues?.glide_table || '',
      glide_table_display_name: initialValues?.glide_table_display_name || '',
      supabase_table: initialValues?.supabase_table || '',
      sync_direction: initialValues?.sync_direction || 'to_supabase',
    },
  });

  // Update the form when initial values change
  useEffect(() => {
    if (initialValues) {
      form.reset({
        connection_id: initialValues.connection_id || '',
        glide_table: initialValues.glide_table || '',
        glide_table_display_name: initialValues.glide_table_display_name || '',
        supabase_table: initialValues.supabase_table || '',
        sync_direction: initialValues.sync_direction || 'to_supabase',
      });
    }
  }, [initialValues, form]);

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
  const handleSubmit = (values: MappingFormValues) => {
    // Add default column mappings if needed
    const formData = {
      ...values,
      // Ensure display name is set
      glide_table_display_name: values.glide_table_display_name || values.glide_table,
      // Add default column mappings (will be overridden by any existing ones)
      column_mappings: initialValues?.column_mappings || getDefaultColumnMappings(),
    };
    
    onSubmit(formData);
  };

  return (
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

        <FormField
          control={form.control}
          name="supabase_table"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supabase Table</FormLabel>
              <FormControl>
                <SupabaseTableSelect
                  value={field.value}
                  onValueChange={field.onChange}
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
                  onValueChange={field.onChange}
                  onChange={(value) => form.setValue('sync_direction', value as 'to_supabase' | 'to_glide' | 'both')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Mapping'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default MappingForm;
