import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ColumnDefinition {
  name: string;
  type: string;
  isPrimary: boolean;
  isNullable: boolean;
}

const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { name: 'id', type: 'uuid', isPrimary: true, isNullable: false },
  { name: 'glide_row_id', type: 'text', isPrimary: false, isNullable: false },
  { name: 'created_at', type: 'timestamp with time zone', isPrimary: false, isNullable: false },
  { name: 'updated_at', type: 'timestamp with time zone', isPrimary: false, isNullable: true }
];

const DATA_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'integer', label: 'Integer' },
  { value: 'numeric', label: 'Numeric/Decimal' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'timestamp with time zone', label: 'Timestamp' },
  { value: 'date', label: 'Date' },
  { value: 'jsonb', label: 'JSON' },
  { value: 'uuid', label: 'UUID' }
];

interface CreateTableFormProps {
  connectionId: string;
  glideTable: string;
  glideTableDisplayName: string;
  onCancel: () => void;
  onSuccess: () => void;
  isCompact?: boolean;
}

export function CreateTableForm({
  connectionId,
  glideTable,
  glideTableDisplayName,
  onCancel,
  onSuccess,
  isCompact = false
}: CreateTableFormProps) {
  const [tableName, setTableName] = useState('gl_');
  const [columns, setColumns] = useState<ColumnDefinition[]>([...DEFAULT_COLUMNS]);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const addColumn = () => {
    if (!newColumnName) {
      toast({
        title: 'Error',
        description: 'Column name is required',
        variant: 'destructive'
      });
      return;
    }

    // Check for duplicate column names
    if (columns.some(col => col.name === newColumnName)) {
      toast({
        title: 'Error',
        description: 'Column name already exists',
        variant: 'destructive'
      });
      return;
    }

    // Add new column
    setColumns([
      ...columns,
      {
        name: newColumnName,
        type: newColumnType,
        isPrimary: false,
        isNullable: true
      }
    ]);

    // Reset inputs
    setNewColumnName('');
  };

  const removeColumn = (index: number) => {
    // Don't allow removing default columns
    if (index < DEFAULT_COLUMNS.length) {
      toast({
        title: 'Information',
        description: 'Default columns cannot be removed',
      });
      return;
    }

    const newColumns = [...columns];
    newColumns.splice(index, 1);
    setColumns(newColumns);
  };

  const createTable = async () => {
    if (!tableName || !tableName.trim()) {
      toast({
        title: 'Error',
        description: 'Table name is required',
        variant: 'destructive'
      });
      return;
    }

    if (!tableName.startsWith('gl_')) {
      toast({
        title: 'Error',
        description: 'Table name must start with "gl_"',
        variant: 'destructive'
      });
      return;
    }

    setIsCreating(true);

    try {
      // Build the SQL statement for creating the table
      let sql = `CREATE TABLE ${tableName} (\n`;
      
      // Add columns
      const columnDefinitions = columns.map(col => {
        let definition = `  "${col.name}" ${col.type}`;
        if (col.isPrimary) {
          definition += ' PRIMARY KEY';
        }
        if (!col.isNullable) {
          definition += ' NOT NULL';
        }
        return definition;
      });

      sql += columnDefinitions.join(',\n');
      
      // Add timestamps trigger
      sql += `\n);\n\n-- Enable row-level security\nALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;\n\n`;
      sql += `-- Create updated_at trigger\nCREATE TRIGGER set_updated_at\nBEFORE UPDATE ON ${tableName}\nFOR EACH ROW\nEXECUTE FUNCTION public.set_updated_at();`;

      // Execute the SQL query to create the table
      const { error } = await supabase.rpc('gl_admin_execute_sql' as any, { sql_query: sql });

      if (error) throw new Error(error.message);

      toast({
        title: 'Success',
        description: `Table ${tableName} created successfully`
      });

      onSuccess();
      
      // Reset form
      setTableName('gl_');
      setColumns([...DEFAULT_COLUMNS]);
      setNewColumnName('');
      setNewColumnType('text');
    } catch (error) {
      console.error('Error creating table:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create table',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tableName">Table Name</Label>
        <Input
          id="tableName"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
          placeholder="gl_customers"
        />
      </div>

      {!isCompact && (
        <>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Default Columns</h3>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Primary Key</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEFAULT_COLUMNS.map((column) => (
                  <TableRow key={column.name}>
                    <TableCell>{column.name}</TableCell>
                    <TableCell>{column.type}</TableCell>
                    <TableCell>{column.isNullable ? 'No' : 'Yes'}</TableCell>
                    <TableCell>{column.isPrimary ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Additional Columns</h3>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Primary Key</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {columns.slice(DEFAULT_COLUMNS.length).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No additional columns defined
                    </TableCell>
                  </TableRow>
                ) : (
                  columns.slice(DEFAULT_COLUMNS.length).map((column, index) => (
                    <TableRow key={column.name}>
                      <TableCell>{column.name}</TableCell>
                      <TableCell>{column.type}</TableCell>
                      <TableCell>{column.isNullable ? 'No' : 'Yes'}</TableCell>
                      <TableCell>{column.isPrimary ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeColumn(index + DEFAULT_COLUMNS.length)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                <Label htmlFor="newColumnName">Column Name</Label>
                <Input
                  id="newColumnName"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="customer_name"
                />
              </div>
              <div className="col-span-5">
                <Label htmlFor="newColumnType">Data Type</Label>
                <Select value={newColumnType} onValueChange={setNewColumnType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={addColumn}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={createTable}
          disabled={isCreating || !tableName}
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Table'
          )}
        </Button>
      </div>
    </div>
  );
} 