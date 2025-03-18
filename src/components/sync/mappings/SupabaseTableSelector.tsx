import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreateTableForm } from './CreateTableForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SupabaseTable {
  table_name: string;
  schema?: string;
}

interface SupabaseTableSelectorProps {
  tables: SupabaseTable[];
  value: string;
  onTableChange: (tableName: string) => void;
  onCreateTableSuccess?: (tableName: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  filterPrefix?: string;
}

export function SupabaseTableSelector({
  tables,
  value,
  onTableChange,
  onCreateTableSuccess,
  disabled = false,
  isLoading = false,
  placeholder = 'Select a table',
  filterPrefix
}: SupabaseTableSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Filter tables based on search term and optional prefix
  const filteredTables = tables
    .filter(table => {
      // Apply prefix filter if specified
      if (filterPrefix && !table.table_name.startsWith(filterPrefix)) {
        return false;
      }
      
      // Apply search term filter
      return table.table_name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => a.table_name.localeCompare(b.table_name));

  const handleCreateTable = (tableName: string) => {
    setShowCreateDialog(false);
    if (onCreateTableSuccess) {
      onCreateTableSuccess(tableName);
    }
    onTableChange(tableName);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2">
        <Select
          value={value}
          onValueChange={onTableChange}
          disabled={disabled || isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </div>
            ) : (
              <>
                <div className="px-2 py-1.5">
                  <div className="flex items-center border rounded-md px-2">
                    <Search className="h-4 w-4 text-muted-foreground mr-2" />
                    <Input 
                      className="border-0 p-1 h-8 focus-visible:ring-0 focus-visible:ring-offset-0" 
                      placeholder="Search tables..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                {filteredTables.length === 0 ? (
                  <div className="p-2 text-muted-foreground text-center">
                    {searchTerm ? 'No tables found' : 'No tables available'}
                  </div>
                ) : (
                  filteredTables.map((table) => (
                    <SelectItem key={table.table_name} value={table.table_name}>
                      {table.table_name}
                    </SelectItem>
                  ))
                )}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {onCreateTableSuccess && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreateDialog(true)}
          className="w-full"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Create new table
        </Button>
      )}

      {/* Create Table Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Supabase Table</DialogTitle>
          </DialogHeader>
          <CreateTableForm
            onTableCreated={handleCreateTable}
            onCancel={() => setShowCreateDialog(false)}
            isCompact={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 