import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from "@/components/ui/checkbox";
import { Database } from "@/integrations/supabase/types";

interface ColumnDefinition {
  name: string;
  type: string;
  isPrimary: boolean;
  isNullable: boolean;
  isNew?: boolean;
  markedForRemoval?: boolean;
}

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

const PROTECTED_COLUMNS = ['id', 'glide_row_id', 'created_at', 'updated_at'];

interface EditTableFormProps {
  tableName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Custom type for gl_get_table_columns RPC return type
type TableColumn = {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  is_primary_key: boolean;
};

export function EditTableForm({ tableName, onSuccess, onCancel }: EditTableFormProps) {
  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  const [isNullable, setIsNullable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [columnsToRemove, setColumnsToRemove] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch current table structure
  useEffect(() => {
    async function fetchTableColumns() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .rpc<TableColumn[]>('gl_get_table_columns', { table_name: tableName });

        if (error) throw error;

        if (data && Array.isArray(data)) {
          const formattedColumns = data.map(col => ({
            name: col.column_name,
            type: col.data_type,
            isPrimary: col.is_primary_key,
            isNullable: col.is_nullable
          }));
          setColumns(formattedColumns);
        }
      } catch (error) {
        console.error('Error fetching table columns:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to fetch table columns',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (tableName) {
      fetchTableColumns();
    }
  }, [tableName, toast]);

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
        isNullable: isNullable,
        isNew: true
      }
    ]);

    // Reset inputs
    setNewColumnName('');
    setIsNullable(true);
  };

  const markColumnForRemoval = (columnName: string) => {
    // Check if it's a protected column
    if (PROTECTED_COLUMNS.includes(columnName)) {
      toast({
        title: 'Cannot Remove Column',
        description: 'This is a protected column required for Glide sync functionality',
        variant: 'destructive'
      });
      return;
    }

    // If it's a new column, just remove it from the list
    const columnIndex = columns.findIndex(col => col.name === columnName);
    if (columnIndex !== -1 && columns[columnIndex].isNew) {
      const updatedColumns = [...columns];
      updatedColumns.splice(columnIndex, 1);
      setColumns(updatedColumns);
      return;
    }

    // Otherwise mark it for removal
    setColumnsToRemove([...columnsToRemove, columnName]);
    
    // Update the UI to show it as marked for removal
    setColumns(columns.map(col => 
      col.name === columnName ? { ...col, markedForRemoval: true } : col
    ));
  };

  const undoRemoval = (columnName: string) => {
    setColumnsToRemove(columnsToRemove.filter(name => name !== columnName));
    
    // Update the UI to show it's no longer marked for removal
    setColumns(columns.map(col => 
      col.name === columnName ? { ...col, markedForRemoval: false } : col
    ));
  };

  const updateTable = async () => {
    setIsUpdating(true);
    
    try {
      // Validate inputs
      const invalidColumns = columns.filter(col => col.isNew && (!col.name || !col.type));
      if (invalidColumns.length > 0) {
        throw new Error("All columns must have a name and type");
      }

      let sql = '';
      
      // First handle column removals
      for (const columnName of columnsToRemove) {
        sql += `ALTER TABLE ${tableName} DROP COLUMN IF EXISTS "${columnName}";\n`;
      }
      
      // Then handle new columns
      const newColumns = columns.filter(col => col.isNew);
      for (const column of newColumns) {
        let columnDef = `ALTER TABLE ${tableName} ADD COLUMN "${column.name}" ${column.type}`;
        if (!column.isNullable) {
          columnDef += ' NOT NULL';
        }
        columnDef += ';\n';
        sql += columnDef;
      }
      
      // If we have changes to apply
      if (sql) {
        const { error } = await supabase.rpc<Database["public"]["Functions"]["gl_admin_execute_sql"]["Returns"]>(
          'gl_admin_execute_sql', 
          { sql_query: sql }
        );

        if (error) throw new Error(error.message);
        
        toast({
          title: 'Success',
          description: `Table ${tableName} updated successfully`
        });
        
        onSuccess();
      } else {
        toast({
          title: 'No Changes',
          description: 'No changes were made to the table'
        });
      }
    } catch (error) {
      console.error('Error updating table:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update table',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const hasChanges = () => {
    return columnsToRemove.length > 0 || columns.some(col => col.isNew);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Table: {tableName}</CardTitle>
        <CardDescription>
          Add or remove columns from the existing table.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {columnsToRemove.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              You are about to remove {columnsToRemove.length} column(s). This will delete all data in these columns.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Current Columns</h3>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Primary Key</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {columns.map((column) => (
                <TableRow 
                  key={column.name} 
                  className={column.markedForRemoval ? 'opacity-50 line-through' : ''}
                >
                  <TableCell>{column.name}</TableCell>
                  <TableCell>{column.type}</TableCell>
                  <TableCell>{column.isNullable ? 'No' : 'Yes'}</TableCell>
                  <TableCell>{column.isPrimary ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    {column.markedForRemoval ? (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => undoRemoval(column.name)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markColumnForRemoval(column.name)}
                        disabled={PROTECTED_COLUMNS.includes(column.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
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
            <div className="col-span-4">
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
            <div className="col-span-1">
              <Label htmlFor="isNullable">Nullable</Label>
              <Select value={isNullable ? "true" : "false"} onValueChange={(val) => setIsNullable(val === "true")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
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

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={updateTable}
            disabled={isUpdating || !hasChanges()}
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Table'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 