
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export interface SyncDirectionSelectProps {
  value: 'to_supabase' | 'to_glide' | 'both';
  onValueChange: (value: string) => void;
  disabled?: boolean;
  // Added missing prop
  onChange?: (value: string) => void;
}

export const SyncDirectionSelect: React.FC<SyncDirectionSelectProps> = ({
  value,
  onValueChange,
  disabled = false,
  onChange
}) => {
  const handleChange = (newValue: string) => {
    onValueChange(newValue);
    
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <Select
      value={value}
      onValueChange={handleChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select sync direction" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="to_supabase">
          <div className="flex items-center">
            <ArrowDown className="mr-2 h-4 w-4 text-blue-500" />
            <span>Glide → Supabase (one-way)</span>
          </div>
        </SelectItem>
        <SelectItem value="to_glide">
          <div className="flex items-center">
            <ArrowUp className="mr-2 h-4 w-4 text-green-500" />
            <span>Supabase → Glide (one-way)</span>
          </div>
        </SelectItem>
        <SelectItem value="both">
          <div className="flex items-center">
            <ArrowUpDown className="mr-2 h-4 w-4 text-purple-500" />
            <span>Two-way Sync</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
