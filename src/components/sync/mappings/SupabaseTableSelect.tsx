
import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useSupabaseTables } from '@/hooks/useSupabaseTables';

export interface SupabaseTableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  onTableSelect?: (table: string) => void;
  selectedTable?: string;
}

export const SupabaseTableSelect: React.FC<SupabaseTableSelectProps> = ({
  value,
  onValueChange,
  isLoading: externalLoading = false,
  disabled = false,
  onTableSelect,
  selectedTable
}) => {
  const { tables, isLoading: tablesLoading, error } = useSupabaseTables();
  const isLoading = externalLoading || tablesLoading;

  const handleChange = (newValue: string) => {
    onValueChange(newValue);
    
    if (onTableSelect) {
      onTableSelect(newValue);
    }
  };

  // Use selectedTable if provided, otherwise use value
  const effectiveValue = selectedTable || value;

  return (
    <Select 
      value={effectiveValue}
      onValueChange={handleChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a Supabase table" />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Loading tables...</span>
          </div>
        ) : tables.length === 0 ? (
          <div className="p-2 text-center text-sm text-muted-foreground">
            {error ? `Error: ${error}` : 'No tables found'}
          </div>
        ) : (
          tables.map((table) => (
            <SelectItem key={table.table_name} value={table.table_name}>
              {table.table_name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};
