
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export interface SupabaseTable {
  table_name: string;
  [key: string]: any;
}

export interface SupabaseTableSelectProps {
  tables: string[] | SupabaseTable[];
  value: string;
  onValueChange: (value: string) => void;
  isLoading?: boolean;
  onOpen?: () => void;
}

export const SupabaseTableSelect: React.FC<SupabaseTableSelectProps> = ({ 
  tables, 
  value, 
  onValueChange, 
  isLoading = false,
  onOpen
}) => {
  return (
    <div>
      <Label htmlFor="supabase_table">Supabase Table</Label>
      <Select 
        value={value} 
        onValueChange={onValueChange}
        onOpenChange={(open) => {
          if (open && onOpen) {
            onOpen();
          }
        }}
      >
        <SelectTrigger id="supabase_table">
          <SelectValue placeholder="Select Supabase table" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading tables...
            </div>
          ) : tables.length === 0 ? (
            <div className="p-2 text-center text-muted-foreground">
              No tables found
            </div>
          ) : (
            tables.map((table) => {
              const tableName = typeof table === 'string' ? table : table.table_name;
              return (
                <SelectItem key={tableName} value={tableName}>
                  {tableName}
                </SelectItem>
              );
            })
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
