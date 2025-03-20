
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

interface Connection {
  id: string;
  app_name: string;
  app_id: string;
}

interface ConnectionSelectProps {
  connections: Connection[];
  value: string;
  onValueChange: (value: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const ConnectionSelect: React.FC<ConnectionSelectProps> = ({
  connections,
  value,
  onValueChange,
  isLoading,
  disabled = false
}) => {
  return (
    <div className="grid gap-2">
      <Label htmlFor="connection">Glide Connection</Label>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={isLoading || disabled || connections.length === 0}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a connection" />
        </SelectTrigger>
        <SelectContent>
          {connections.map((connection) => (
            <SelectItem key={connection.id} value={connection.id}>
              {connection.app_name || connection.app_id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isLoading && (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
          Loading connections...
        </div>
      )}
    </div>
  );
};
