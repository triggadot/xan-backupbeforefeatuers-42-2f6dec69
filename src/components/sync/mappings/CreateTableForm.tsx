
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface CreateTableFormProps {
  connectionId: string;
  glideTable: string;
  glideTableDisplayName: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export const CreateTableForm: React.FC<CreateTableFormProps> = ({
  connectionId,
  glideTable,
  glideTableDisplayName,
  onCancel,
  onSuccess
}) => {
  const [tableName, setTableName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tableName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a table name',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Check if table exists
      const { data: existingTables, error: checkError } = await supabase
        .from('gl_tables_view')
        .select('*')
        .eq('table_name', tableName.toLowerCase());
      
      if (checkError) throw checkError;
      
      if (existingTables && existingTables.length > 0) {
        toast({
          title: 'Table Already Exists',
          description: `A table named "${tableName}" already exists.`,
          variant: 'destructive',
        });
        return;
      }
      
      // Create a simple RPC call to create table function - this would typically be 
      // implemented on the backend
      const { error: createError } = await supabase
        .rpc('create_table_from_glide', {
          p_connection_id: connectionId,
          p_glide_table: glideTable,
          p_supabase_table: tableName.toLowerCase()
        });
      
      if (createError) throw createError;
      
      toast({
        title: 'Success',
        description: `Table "${tableName}" created successfully`,
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating table:', error);
      toast({
        title: 'Error Creating Table',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tableName">Table Name</Label>
        <Input
          id="tableName"
          placeholder="Enter table name"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
          required
        />
        <p className="text-sm text-muted-foreground">
          This will be the name of the table in Supabase.
        </p>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Table'}
        </Button>
      </div>
    </form>
  );
};
