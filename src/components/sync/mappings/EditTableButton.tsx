import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseTables } from '@/hooks/gl-sync/useSupabaseTables';
import { Table } from 'lucide-react';

interface EditTableButtonProps {
  onTableUpdated: () => void;
  initialTableName?: string;
}

export function EditTableButton({ onTableUpdated, initialTableName }: EditTableButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(initialTableName || '');
  const { tables, isLoading } = useSupabaseTables();
  
  const glTables = tables
    .filter(table => table.table_name.startsWith('gl_'))
    .sort((a, b) => a.table_name.localeCompare(b.table_name));

  return (
    <>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setIsOpen(true)}
        disabled={isLoading}
      >
        <Table className="h-4 w-4 mr-2" />
        Edit Table Schema
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Table Schema</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="table-select">Select Table</Label>
              <Select 
                value={selectedTable} 
                onValueChange={setSelectedTable}
                disabled={isLoading}
              >
                <SelectTrigger id="table-select">
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {glTables.map(table => (
                    <SelectItem key={table.table_name} value={table.table_name}>
                      {table.table_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTable && (
              <div className="space-y-2 pt-2">
                <Label>Edit SQL</Label>
                <div className="bg-slate-100 p-4 rounded-md">
                  <code className="text-sm">
                    To edit the table schema, run the following SQL commands in the Supabase SQL Editor:
                  </code>
                  <pre className="text-xs mt-2 overflow-x-auto p-2 bg-slate-200 rounded">
                    {`-- Add a column
ALTER TABLE ${selectedTable} ADD COLUMN new_column_name text;

-- Change a column type
ALTER TABLE ${selectedTable} ALTER COLUMN column_name TYPE new_type;

-- Add a constraint
ALTER TABLE ${selectedTable} ADD CONSTRAINT constraint_name UNIQUE (column_name);`}
                  </pre>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  For more complex schema changes, please use the Supabase dashboard SQL editor.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => {
                setIsOpen(false);
                onTableUpdated();
              }}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 