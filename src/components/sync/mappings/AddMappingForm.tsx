import React, { useState } from 'react';
import { useToast } from '@/hooks/utils/use-toast';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { GlColumnMapping } from '@/types/glsync';
import { convertToDbMapping, getDefaultColumnMappings } from '@/utils/gl-mapping-converters';
import { useGlSync } from '@/hooks/gl-sync';

interface AddMappingFormProps {
  onSuccess?: () => Promise<void>;
}

const formSchema = z.object({
  connection_id: z.string().uuid(),
  glide_table: z.string().min(1, "Glide table ID is required"),
  glide_table_display_name: z.string().min(1, "Glide table name is required"),
  supabase_table: z.string().min(1, "Supabase table is required"),
  sync_direction: z.enum(['to_supabase', 'to_glide', 'both']),
});

export function AddMappingForm({ onSuccess }: AddMappingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [glideTables, setGlideTables] = useState<any[]>([]);
  const [supaTables, setSupaTables] = useState<any[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [isLoadingGlideTables, setIsLoadingGlideTables] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const { toast } = useToast();
  const { fetchGlideTables } = useGlSync();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sync_direction: 'to_supabase',
    },
  });
  
  React.useEffect(() => {
    loadConnections();
  }, []);
  
  const loadConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load connections',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingConnections(false);
    }
  };
  
  const loadSupabaseTables = async () => {
    setIsLoadingTables(true);
    try {
      const { data, error } = await supabase
        .from('gl_tables_view')
        .select('*')
        .order('table_name');
      
      if (error) throw error;
      setSupaTables(data || []);
    } catch (error) {
      console.error('Error fetching Supabase tables:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Supabase tables',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTables(false);
    }
  };
  
  const handleConnectionChange = async (connectionId: string) => {
    form.setValue('connection_id', connectionId);
    
    // Clear glide table selection
    form.setValue('glide_table', '');
    form.setValue('glide_table_display_name', '');
    
    // Fetch Glide tables for the selected connection
    setIsLoadingGlideTables(true);
    try {
      const result = await fetchGlideTables(connectionId);
      if (result.tables) {
        console.log('Loaded Glide tables:', result.tables);
        setGlideTables(result.tables);
      } else {
        toast({
          title: 'Warning',
          description: result.error || 'No Glide tables found',
          variant: 'destructive',
        });
        setGlideTables([]);
      }
    } catch (error) {
      console.error('Error fetching Glide tables:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch Glide tables',
        variant: 'destructive',
      });
      setGlideTables([]);
    } finally {
      setIsLoadingGlideTables(false);
    }
  };
  
  const handleGlideTableChange = (tableId: string) => {
    const selectedTable = glideTables.find(table => table.id === tableId);
    if (selectedTable) {
      console.log('Selected Glide table:', selectedTable);
      form.setValue('glide_table', tableId);
      form.setValue('glide_table_display_name', selectedTable.display_name);
    }
  };
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      console.log('Submitting form values:', values);
      
      // Create a default column mapping with $rowID
      const defaultMapping = getDefaultColumnMappings();
      
      // Convert the mapping to a database-compatible format
      const dbMapping = convertToDbMapping({
        connection_id: values.connection_id,
        glide_table: values.glide_table,
        glide_table_display_name: values.glide_table_display_name,
        supabase_table: values.supabase_table,
        column_mappings: defaultMapping,
        sync_direction: values.sync_direction,
        enabled: true
      });
      
      console.log('Inserting mapping with data:', dbMapping);
      
      const { data, error } = await supabase
        .from('gl_mappings')
        .insert(dbMapping)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Mapping created',
        description: 'The table mapping has been created successfully.',
      });
      
      if (onSuccess) {
        await onSuccess();
      }
      
      form.reset();
    } catch (error) {
      console.error('Error creating mapping:', error);
      toast({
        title: 'Error',
        description: 'Failed to create mapping',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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
              <FormLabel>Glide Connection</FormLabel>
              <Select 
                onValueChange={(value) => handleConnectionChange(value)} 
                value={field.value}
                disabled={isLoadingConnections}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a connection" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingConnections ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </div>
                  ) : connections.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">
                      No connections found
                    </div>
                  ) : (
                    connections.map((conn) => (
                      <SelectItem key={conn.id} value={conn.id}>
                        {conn.app_name || conn.app_id}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="glide_table"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Glide Table</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={handleGlideTableChange}
                  disabled={isLoadingGlideTables || glideTables.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingGlideTables ? "Loading tables..." : "Select a Glide table"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingGlideTables ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading tables...
                      </div>
                    ) : glideTables.length === 0 ? (
                      <div className="p-2 text-center text-muted-foreground">
                        No tables found
                      </div>
                    ) : (
                      glideTables.map((table) => (
                        <SelectItem key={table.id} value={table.id}>
                          {table.display_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="glide_table_display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Glide Table Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter Glide table display name" readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="supabase_table"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supabase Table</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                onOpenChange={(open) => {
                  if (open && supaTables.length === 0) {
                    loadSupabaseTables();
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Supabase table" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingTables ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </div>
                  ) : supaTables.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">
                      No tables found
                    </div>
                  ) : (
                    supaTables.map((table) => (
                      <SelectItem key={table.table_name} value={table.table_name}>
                        {table.table_name}
                      </SelectItem>
                    ))
                  )}
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sync direction" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="to_supabase">Glide → Supabase</SelectItem>
                  <SelectItem value="to_glide">Supabase → Glide</SelectItem>
                  <SelectItem value="both">Bidirectional</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Mapping
          </Button>
        </div>
      </form>
    </Form>
  );
}
