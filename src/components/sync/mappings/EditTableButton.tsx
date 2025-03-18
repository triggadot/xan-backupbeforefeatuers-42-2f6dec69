import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
import { EditTableDialog } from './EditTableDialog';
import { useSupabaseTables } from '@/hooks/useSupabaseTables';

interface EditTableButtonProps {
  onTableUpdated?: () => void;
}

export function EditTableButton({ onTableUpdated }: EditTableButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState('');
  const { tables, isLoading, fetchTables } = useSupabaseTables();
  
  // Filter tables to only show gl_ tables
  const glTables = tables.filter(table => table.table_name.startsWith('gl_'));

  const handleSuccess = () => {
    fetchTables();
    if (onTableUpdated) {
      onTableUpdated();
    }
  };

  return (
    <div>
      <div className="flex space-x-2 mb-4">
        <select
          className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Select a table to edit</option>
          {glTables.map((table) => (
            <option key={table.table_name} value={table.table_name}>
              {table.table_name}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          disabled={!selectedTable}
          className="whitespace-nowrap"
        >
          <Database className="h-4 w-4 mr-2" />
          Edit Schema
        </Button>
      </div>

      {selectedTable && (
        <EditTableDialog
          tableName={selectedTable}
          open={open}
          onOpenChange={setOpen}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
} 