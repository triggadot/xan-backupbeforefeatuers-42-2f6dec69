
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { glSyncApi } from '@/services/glsync';
import { Loader2 } from 'lucide-react';
import { GlideTable } from '@/types/glsync';

export interface GlideTableSelectorProps {
  connectionId: string;
  selectedTableId?: string;
  onTableSelect?: (tableId: string, tableName: string) => void;
  onAddTable?: (table: GlideTable) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  value?: string;
  tables?: GlideTable[];
  onTableChange?: (tableId: string) => void;
}

const GlideTableSelector: React.FC<GlideTableSelectorProps> = ({
  connectionId,
  selectedTableId,
  onTableSelect,
  onAddTable,
  disabled = false,
  isLoading: externalLoading = false,
  placeholder = "Select a Glide table",
  value,
  tables: providedTables,
  onTableChange
}) => {
  const [tables, setTables] = useState<GlideTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // If tables are provided externally, use those instead of fetching
    if (providedTables && providedTables.length > 0) {
      setTables(providedTables);
      return;
    }
    
    async function fetchGlideTables() {
      if (!connectionId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await glSyncApi.listGlideTables(connectionId);
        
        if (!result.success || !result.tables) {
          throw new Error(result.error || 'Failed to fetch Glide tables');
        }
        
        const formattedTables: GlideTable[] = result.tables.map((table: any) => ({
          id: table.id,
          display_name: table.name || table.id
        }));
        
        setTables(formattedTables);
        
        // If there's a selectedTableId, validate it exists in the fetched tables
        if (selectedTableId && !formattedTables.some(t => t.id === selectedTableId)) {
          setError('Previously selected table is no longer available');
        }
      } catch (error) {
        console.error('Error fetching Glide tables:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchGlideTables();
  }, [connectionId, selectedTableId, providedTables]);
  
  const handleTableChange = (tableId: string) => {
    const selectedTable = tables.find(t => t.id === tableId);
    
    // Handle legacy onTableChange
    if (selectedTable && onTableChange) {
      onTableChange(tableId);
    }
    
    // Handle onTableSelect with display name
    if (selectedTable && onTableSelect) {
      onTableSelect(tableId, selectedTable.display_name);
    }
    
    // Handle onAddTable for full object
    if (selectedTable && onAddTable) {
      onAddTable(selectedTable);
    }
  };
  
  // If we're fetching a new connection's tables, show loading
  if (loading || externalLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading tables...</span>
      </div>
    );
  }
  
  // If there's an error, show it
  if (error) {
    return (
      <div className="text-destructive text-sm">{error}</div>
    );
  }
  
  // If there are no tables, show a message
  if (tables.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        No tables found in this Glide application
      </div>
    );
  }
  
  return (
    <Select
      disabled={disabled || loading}
      value={value || selectedTableId}
      onValueChange={handleTableChange}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {tables.map(table => (
          <SelectItem key={table.id} value={table.id}>
            {table.display_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default GlideTableSelector;
