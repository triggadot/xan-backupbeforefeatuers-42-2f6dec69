
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownToLine, ArrowUpFromLine, ArrowUpDown } from 'lucide-react';

interface SyncDirectionSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const SyncDirectionSelect: React.FC<SyncDirectionSelectProps> = ({ value, onValueChange }) => {
  return (
    <div>
      <Label htmlFor="sync_direction">Sync Direction</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id="sync_direction">
          <SelectValue placeholder="Select sync direction" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="to_supabase">
            <div className="flex items-center">
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              <span>Glide → Supabase</span>
            </div>
          </SelectItem>
          <SelectItem value="to_glide">
            <div className="flex items-center">
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
              <span>Supabase → Glide</span>
            </div>
          </SelectItem>
          <SelectItem value="both">
            <div className="flex items-center">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <span>Bidirectional</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
