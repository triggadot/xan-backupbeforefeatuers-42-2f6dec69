import React, { useState, useEffect } from 'react';
import { Search } from "lucide-react";
import { GlideTable } from '@/types/glide-sync/glsync';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Interface for table objects that might have different property names
interface TableLike {
  id?: string;
  tableId?: string;
  table_id?: string;
  displayName?: string;
  display_name?: string;
  name?: string;
}

interface GlideTableSelectorProps {
  tables: GlideTable[];
  value: string;
  onTableChange: (tableId: string, displayName: string) => void;
  onAddTable?: (table: GlideTable) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

const GlideTableSelector: React.FC<GlideTableSelectorProps> = ({ 
  tables,
  value,
  onTableChange,
  onAddTable,
  disabled = false,
  isLoading = false,
  placeholder = 'Select a table'
}) => {
  const [newTableId, setNewTableId] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTable, setShowAddTable] = useState(false);
  const [normalizedTables, setNormalizedTables] = useState<GlideTable[]>([]);

  // Normalize tables to ensure they have the expected structure
  useEffect(() => {
    if (!tables) {
      setNormalizedTables([]);
      return;
    }

    const normalized = tables
      .filter(table => table) // Filter out null/undefined tables
      .map(table => {
        // Handle different possible formats of table data
        if (typeof table === 'string') {
          return { id: table, displayName: table };
        }
        
        // Ensure the table has id and displayName properties
        const tableObj = table as TableLike; // Cast to TableLike for flexible property access
        return {
          id: tableObj.id || tableObj.tableId || tableObj.table_id || '',
          displayName: tableObj.displayName || tableObj.display_name || tableObj.name || tableObj.id || ''
        };
      })
      .filter(table => table.id); // Filter out tables with no id
    
    setNormalizedTables(normalized);
  }, [tables]);

  // Filter tables based on search term with null/undefined checks
  const filteredTables = normalizedTables.filter(table => 
    table.displayName && (
      table.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleTableChange = (tableId: string) => {
    const selectedTable = normalizedTables.find(t => t.id === tableId);
    if (selectedTable) {
      onTableChange(selectedTable.id, selectedTable.displayName);
    }
  };

  const handleAddNewTable = () => {
    if (newTableId && newTableName && onAddTable) {
      const newTable: GlideTable = {
        id: newTableId,
        displayName: newTableName
      };
      onAddTable(newTable);
      setNewTableId('');
      setNewTableName('');
      setShowAddTable(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2">
        <Select
          value={value}
          onValueChange={handleTableChange}
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
            ) : filteredTables.length === 0 ? (
              <div className="p-2 text-muted-foreground text-center">
                {searchTerm ? 'No tables found' : 'No tables available'}
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
                {filteredTables.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    {table.displayName}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {showAddTable && onAddTable && (
        <div className="space-y-2 p-2 border rounded-md">
          <div className="space-y-1">
            <Input
              placeholder="Table ID"
              value={newTableId}
              onChange={(e) => setNewTableId(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Input
              placeholder="Display Name"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
            />
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleAddNewTable}
            disabled={!newTableId || !newTableName}
            className="w-full"
          >
            Add Table
          </Button>
        </div>
      )}

      {onAddTable && !showAddTable && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddTable(true)}
          className="w-full"
        >
          Can't find your table? Add manually
        </Button>
      )}
    </div>
  );
};

export default GlideTableSelector;
