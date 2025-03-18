
import React from 'react';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

type SyncDirection = 'to_supabase' | 'to_glide' | 'both';

interface SyncDirectionSelectProps {
  value: SyncDirection;
  onValueChange: (value: SyncDirection) => void;
  disabled?: boolean;
}

export const SyncDirectionSelect: React.FC<SyncDirectionSelectProps> = ({
  value,
  onValueChange,
  disabled = false
}) => {
  return (
    <div className="grid gap-2">
      <Label htmlFor="syncDirection">Sync Direction</Label>
      <Select
        value={value}
        onValueChange={onValueChange as (value: string) => void}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select sync direction" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="to_supabase">Glide → Supabase</SelectItem>
          <SelectItem value="to_glide">Supabase → Glide</SelectItem>
          <SelectItem value="both">Bidirectional</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Note: For now, only Glide to Supabase syncing is fully supported
      </p>
    </div>
  );
};
