
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { GlConnection, GlMapping, GlideTable } from '@/types/glsync';
import { GlideTableSelector } from '../GlideTableSelector';
import ColumnMappingForm from '@/components/sync/ColumnMappingForm';
import { ArrowRight, ArrowLeft, ArrowRightLeft, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGlSync } from '@/hooks/useGlSync';
import { useMappingOperations } from '@/hooks/useMappingOperations';

// Define form schema
const mappingFormSchema = z.object({
  connection_id: z.string().min(1, 'Connection is required'),
  glide_table: z.string().min(1, 'Glide table is required'),
  glide_table_display_name: z.string().min(1, 'Glide table display name is required'),
  supabase_table: z.string().min(1, 'Supabase table is required'),
  sync_direction: z.enum(['to_supabase', 'to_glide', 'both']),
  enabled: z.boolean().default(true),
});

type MappingFormValues = z.infer<typeof mappingFormSchema>;

interface MappingFormContainerProps {
  mapping?: GlMapping;
  isEditing: boolean;
  connections: GlConnection[];
  supabaseTables: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

const MappingFormContainer = ({
  mapping,
  isEditing,
  connections,
  supabaseTables,
  onSuccess,
  onCancel
}: MappingFormContainerProps) => {
  const [activeTab, setActiveTab] = useState('general');
  const [glideTables, setGlideTables] = useState<GlideTable[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [glideColumns, setGlideColumns] = useState<Array<{ id: string; name: string; type?: string }>>([]);
  const [columnMappings, setColumnMappings] = useState(mapping?.column_mappings || {});
  
  const { fetchGlideTables, fetchGlideTableColumns } = useGlSync();
  const { createMapping, updateMapping, isSubmitting } = useMappingOperations();

  // Initialize form
  const form = useForm<MappingFormValues>({
    resolver: zodResolver(mappingFormSchema),
    defaultValues: {
      connection_id: mapping?.connection_id || '',
      glide_table: mapping?.glide_table || '',
      glide_table_display_name: mapping?.glide_table_display_name || '',
      supabase_table: mapping?.supabase_table || '',
      sync_direction: mapping?.sync_direction || 'to_supabase',
      enabled: mapping?.enabled !== undefined ? mapping.enabled : true,
    },
  });

  // Load Glide tables when connection changes
  useEffect(() => {
    const connectionId = form.watch('connection_id');
    if (connectionId) {
      loadGlideTables(connectionId);
    }
  }, [form.watch('connection_id')]);

  // Load Glide columns when table changes
  useEffect(() => {
    const connectionId = form.watch('connection_id');
    const glideTable = form.watch('glide_table');
    if (connectionId && glideTable) {
      loadGlideColumns(connectionId, glideTable);
    }
  }, [form.watch('glide_table')]);

  const loadGlideTables = async (connectionId: string) => {
    setIsLoadingTables(true);
    try {
      const result = await fetchGlideTables(connectionId);
      if ('tables' in result) {
        setGlideTables(result.tables);
      } else {
        setGlideTables([]);
      }
    } catch (error) {
      console.error('Error loading Glide tables:', error);
    } finally {
      setIsLoadingTables(false);
    }
  };

  const loadGlideColumns = async (connectionId: string, tableId: string) => {
    try {
      const result = await fetchGlideTableColumns(connectionId, tableId);
      if ('columns' in result) {
        setGlideColumns(result.columns.map(col => ({
          id: col.id,
          name: col.name,
          type: col.type
        })));
      } else {
        setGlideColumns([]);
      }
    } catch (error) {
      console.error('Error loading Glide columns:', error);
    }
  };

  const handleGlideTableChange = (tableId: string, displayName: string) => {
    form.setValue('glide_table', tableId);
    form.setValue('glide_table_display_name', displayName);
  };

  const handleColumnMappingsChange = (updatedMappings: Record<string, any>) => {
    setColumnMappings(updatedMappings);
  };

  const handleAddGlideTable = (table: GlideTable) => {
    setGlideTables(prev => [...prev, table]);
  };

  const onSubmit = async (values: MappingFormValues) => {
    // Check if column mappings are defined
    if (!columnMappings || Object.keys(columnMappings).length === 0) {
      form.setError('root', { 
        message: 'At least one column mapping is required.' 
      });
      setActiveTab('column-mappings');
      return;
    }

    // Check if $rowID mapping exists
    if (!columnMappings['$rowID']) {
      form.setError('root', { 
        message: 'Row ID mapping ($rowID to glide_row_id) is required for Glide synchronization.' 
      });
      setActiveTab('column-mappings');
      return;
    }

    const mappingData: Partial<GlMapping> = {
      ...values,
      column_mappings: columnMappings,
    };

    let success = false;

    if (isEditing && mapping) {
      const result = await updateMapping(mapping.id, mappingData);
      success = !!result;
    } else {
      const result = await createMapping(mappingData);
      success = !!result;
    }

    if (success) {
      onSuccess();
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General Settings</TabsTrigger>
              <TabsTrigger 
                value="column-mappings"
                disabled={!form.watch('supabase_table')}
              >
                Column Mappings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="py-4 space-y-4">
              <FormField
                control={form.control}
                name="connection_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Connection <span className="text-red-500">*</span></FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a connection" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Connections</SelectLabel>
                          {connections.map((connection) => (
                            <SelectItem key={connection.id} value={connection.id}>
                              {connection.app_name || 'Unnamed App'}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="glide_table"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Glide Table <span className="text-red-500">*</span></FormLabel>
                    <GlideTableSelector
                      tables={glideTables}
                      value={field.value}
                      onTableChange={handleGlideTableChange}
                      onAddTable={handleAddGlideTable}
                      disabled={isLoadingTables || !form.watch('connection_id')}
                      isLoading={isLoadingTables}
                      placeholder={isLoadingTables ? 'Loading...' : 'Select a Glide table'}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="supabase_table"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supabase Table <span className="text-red-500">*</span></FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Supabase table" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Supabase Tables</SelectLabel>
                          {supabaseTables.map((table) => (
                            <SelectItem key={table} value={table}>
                              {table}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
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
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="to_supabase">
                          <div className="flex items-center">
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Glide to Supabase
                          </div>
                        </SelectItem>
                        <SelectItem value="to_glide">
                          <div className="flex items-center">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Supabase to Glide
                          </div>
                        </SelectItem>
                        <SelectItem value="both">
                          <div className="flex items-center">
                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                            Bidirectional
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Enabled</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            
            <TabsContent value="column-mappings" className="py-4">
              {form.watch('supabase_table') ? (
                <ColumnMappingForm
                  supabaseTable={form.watch('supabase_table')}
                  columnMappings={columnMappings}
                  onUpdate={handleColumnMappingsChange}
                  glideColumns={glideColumns}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Please select a Supabase table first
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {form.formState.errors.root && (
            <p className="text-red-500 text-sm">{form.formState.errors.root.message}</p>
          )}
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};

export default MappingFormContainer;
