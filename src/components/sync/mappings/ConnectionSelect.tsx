
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { GlConnection } from '@/types/glide-sync/glsync';

interface ConnectionSelectProps {
  connections: GlConnection[];
  value: string;
  onValueChange: (value: string) => void;
  isLoading?: boolean;
}

export const ConnectionSelect: React.FC<ConnectionSelectProps> = ({ 
  connections, 
  value, 
  onValueChange, 
  isLoading = false 
}) => {
  return (
    <div>
      <Label htmlFor="connection_id">Glide Connection</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id="connection_id">
          <SelectValue placeholder="Select connection" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </div>
          ) : connections.length === 0 ? (
            <div className="p-2 text-center text-muted-foreground">
              No connections found
            </div>
          ) : (
            connections.map((connection) => (
              <SelectItem key={connection.id} value={connection.id}>
                {connection.app_name || connection.app_id}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
