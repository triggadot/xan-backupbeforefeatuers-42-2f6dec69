
import React, { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { GlideTable } from '@/types/glsync';

interface GlideTableSelectorProps {
  tables: GlideTable[];
  value: string;
  onTableChange: (tableId: string, displayName: string) => void;
  onAddTable?: (newTable: GlideTable) => void;
  disabled?: boolean;
  placeholder?: string;
  isLoading?: boolean;
}

export const GlideTableSelector: React.FC<GlideTableSelectorProps> = ({
  tables,
  value,
  onTableChange,
  onAddTable,
  disabled = false,
  placeholder = 'Select a table',
  isLoading = false,
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableDisplayName, setNewTableDisplayName] = useState('');

  // When tables are loaded, if we have a value but it doesn't match any table, 
  // we need to find it and call onTableChange with its display name
  useEffect(() => {
    if (tables.length > 0 && value) {
      const selectedTable = tables.find(table => table.id === value);
      if (selectedTable) {
        // Make sure the parent has the display name
        console.log('Selected table from useEffect:', selectedTable);
      }
    }
  }, [tables, value]);

  const handleSelectChange = (tableId: string) => {
    if (tableId === 'add-new') {
      setIsAddDialogOpen(true);
      return;
    }
    
    const table = tables.find(t => t.id === tableId);
    if (table) {
      console.log('Selected table:', table);
      onTableChange(table.id, table.display_name);
    }
  };

  const handleAddTable = () => {
    if (!newTableName || !newTableDisplayName) return;
    
    // Prefix with 'native' if needed
    const tableId = newTableName.startsWith('native') ? newTableName : `native${newTableName}`;
    
    const newTable = {
      id: tableId,
      display_name: newTableDisplayName,
    };
    
    console.log('Adding new table:', newTable);
    onAddTable?.(newTable);
    setNewTableName('');
    setNewTableDisplayName('');
    setIsAddDialogOpen(false);
    
    // Select the newly added table
    onTableChange(newTable.id, newTable.display_name);
  };

  return (
    <div className="space-y-2">
      <Select
        value={value}
        onValueChange={handleSelectChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? 'Loading...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Glide Tables</SelectLabel>
            {tables.map((table) => (
              <SelectItem key={table.id} value={table.id}>
                {table.display_name}
              </SelectItem>
            ))}
            {onAddTable && (
              <SelectItem value="add-new" className="text-primary">
                <div className="flex items-center">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add New Table
                </div>
              </SelectItem>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          // Only reset form when dialog is explicitly closed
          setNewTableName('');
          setNewTableDisplayName('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Glide Table</DialogTitle>
            <DialogDescription>
              Enter details for the new Glide table.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="table-id" className="col-span-4">
                Table ID <span className="text-sm text-muted-foreground">(Will be prefixed with 'native' if needed)</span>
              </Label>
              <Input
                id="table-id"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="col-span-4"
                placeholder="Enter table ID"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="display-name" className="col-span-4">
                Display Name
              </Label>
              <Input
                id="display-name"
                value={newTableDisplayName}
                onChange={(e) => setNewTableDisplayName(e.target.value)}
                className="col-span-4"
                placeholder="Enter display name"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTable}>
              Add Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
