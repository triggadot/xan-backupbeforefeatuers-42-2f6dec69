
import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { GlConnection } from '@/types/glsync';
import { glSyncApi } from '@/services/glsync';

export interface ConnectionSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  selectedConnectionId?: string;
  onConnectionSelect?: (connection: GlConnection) => void;
}

export const ConnectionSelect: React.FC<ConnectionSelectProps> = ({
  value,
  onValueChange,
  isLoading: isLoadingProp = false,
  disabled = false,
  selectedConnectionId,
  onConnectionSelect
}) => {
  const [connections, setConnections] = useState<GlConnection[]>([]);
  const [isLoading, setIsLoading] = useState(isLoadingProp);

  useEffect(() => {
    const fetchConnections = async () => {
      setIsLoading(true);
      try {
        const { success, connections } = await glSyncApi.listConnections();
        if (success) {
          setConnections(connections);
        }
      } catch (error) {
        console.error('Failed to fetch connections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConnections();
  }, []);

  const handleChange = (newValue: string) => {
    // Update local state
    onValueChange(newValue);
    
    // If onConnectionSelect is provided, call it with the selected connection
    if (onConnectionSelect) {
      const selectedConnection = connections.find(c => c.id === newValue);
      if (selectedConnection) {
        onConnectionSelect(selectedConnection);
      }
    }
  };

  // Use selectedConnectionId if provided, otherwise use value
  const effectiveValue = selectedConnectionId || value;

  return (
    <div className="grid gap-2">
      <Label htmlFor="connection">Glide Connection</Label>
      <Select
        value={effectiveValue}
        onValueChange={handleChange}
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
