
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Loader2, Plus } from 'lucide-react';
import { GlideTable, convertDbToGlideTable } from '@/types/glsync';
import { NewTableDialog } from './NewTableDialog';

interface GlideTableSelectorProps {
  tables: GlideTable[];
  value: string;
  onTableChange: (id: string, displayName: string) => void;
  onAddTable?: (table: GlideTable) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export function GlideTableSelector({
  tables = [],
  value,
  onTableChange,
  onAddTable,
  disabled = false,
  isLoading = false,
  placeholder = 'Select a table'
}: GlideTableSelectorProps) {
  const [open, setOpen] = useState(false);
  const [newTableDialogOpen, setNewTableDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Find the selected table to display
  const selectedTable = tables.find(table => table.id === value);
  const displayValue = selectedTable ? selectedTable.displayName : '';
  
  const filteredTables = tables.filter(table => 
    table.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Reset search when the popover is closed
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
    }
  }, [open]);
  
  const handleAddTable = (newTable: GlideTable) => {
    if (onAddTable) {
      // Convert to the proper GlideTable format
      const formattedTable = convertDbToGlideTable({
        id: newTable.id,
        display_name: newTable.displayName,
        name: newTable.name
      });
      onAddTable(formattedTable);
    }
    setNewTableDialogOpen(false);
    // Auto-select the new table
    onTableChange(newTable.id, newTable.displayName);
  };
  
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between"
          >
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Loading tables...</span>
              </div>
            ) : displayValue || placeholder}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px]">
          <Command>
            <CommandInput
              placeholder="Search tables..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground mb-4">No tables found</p>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {filteredTables.map((table) => (
                  <CommandItem
                    key={table.id}
                    value={table.id}
                    onSelect={() => {
                      onTableChange(table.id, table.displayName);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === table.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {table.displayName}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            {onAddTable && (
              <div className="p-2 border-t">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => setNewTableDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add new table
                </Button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
      
      {onAddTable && (
        <NewTableDialog
          open={newTableDialogOpen}
          onOpenChange={setNewTableDialogOpen}
          onAddTable={handleAddTable}
        />
      )}
    </>
  );
}
