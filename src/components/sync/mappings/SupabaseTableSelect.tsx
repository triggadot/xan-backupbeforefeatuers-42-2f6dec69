
import React from 'react';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface SupabaseTable {
  table_name: string;
}

interface SupabaseTableSelectProps {
  tables: SupabaseTable[];
  value: string;
  onValueChange: (value: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const SupabaseTableSelect: React.FC<SupabaseTableSelectProps> = ({
  tables,
  value,
  onValueChange,
  isLoading,
  disabled = false
}) => {
  return (
    <div className="grid gap-2">
      <Label htmlFor="supabaseTable">Supabase Table</Label>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={isLoading || disabled || tables.length === 0}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a Supabase table" />
        </SelectTrigger>
        <SelectContent>
          {tables.map((table) => (
            <SelectItem key={table.table_name} value={table.table_name}>
              {table.table_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isLoading && (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
          Loading Supabase tables...
        </div>
      )}
    </div>
  );
};
