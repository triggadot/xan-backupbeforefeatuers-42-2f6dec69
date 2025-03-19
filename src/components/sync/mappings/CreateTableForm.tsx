
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  tableName: z.string().min(3, {
    message: 'Table name must be at least 3 characters.',
  }),
  includeGlideId: z.boolean().default(true),
  createIndexes: z.boolean().default(true),
});

export interface CreateTableFormProps {
  onSuccess: (tableName: string) => void;
  onCancel: () => void;
  isCompact: boolean;
  connectionId?: string;
  glideTable?: string;
  glideTableDisplayName?: string;
}

export const CreateTableForm: React.FC<CreateTableFormProps> = ({
  onSuccess,
  onCancel,
  isCompact,
  connectionId,
  glideTable,
  glideTableDisplayName,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tableName: `gl_${glideTable?.toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'table'}`,
      includeGlideId: true,
      createIndexes: true,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!connectionId || !glideTable) {
      setError('Connection or Glide table information is missing');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Call Supabase function to create table
      const { data, error: funcError } = await supabase.functions.invoke('create_table_from_glide', {
        body: {
          tableName: values.tableName,
          glideTable: glideTable,
          connectionId: connectionId,
          includeGlideId: values.includeGlideId,
          createIndexes: values.createIndexes,
          glideTableDisplayName: glideTableDisplayName || glideTable,
        },
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      onSuccess(values.tableName);
    } catch (err) {
      console.error('Error creating table:', err);
      setError(err instanceof Error ? err.message : 'An error occurred creating the table');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        <FormField
          control={form.control}
          name="tableName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Table Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>
                This will be the name of your table in Supabase.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="includeGlideId"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Include Glide ID</FormLabel>
                  <FormDescription>
                    Add a glide_row_id column for record tracking
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="createIndexes"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Create Indexes</FormLabel>
                  <FormDescription>
                    Add indexes for better query performance
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Table'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
