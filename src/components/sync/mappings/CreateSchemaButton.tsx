import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Database } from 'lucide-react';
import { SchemaSetupDialog } from './SchemaSetupDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConnections } from '@/hooks/useConnections';
import { useGlSync } from '@/hooks/useGlSync';

interface CreateSchemaButtonProps {
  onMappingCreated: () => void;
}

export function CreateSchemaButton({ onMappingCreated }: CreateSchemaButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState('');
  const { connections, isLoading: isLoadingConnections } = useConnections();
  const { fetchGlideTables } = useGlSync();

  const handleConnectionChange = (connectionId: string) => {
    setSelectedConnection(connectionId);
    if (connectionId) {
      fetchGlideTables(connectionId);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select
          value={selectedConnection}
          onValueChange={handleConnectionChange}
          disabled={isLoadingConnections}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a Glide connection" />
          </SelectTrigger>
          <SelectContent>
            {connections.map((connection) => (
              <SelectItem key={connection.id} value={connection.id}>
                {connection.app_name || connection.app_id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          disabled={!selectedConnection}
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Create Schema & Mapping
        </Button>
      </div>

      {selectedConnection && (
        <SchemaSetupDialog
          open={open}
          onOpenChange={setOpen}
          connectionId={selectedConnection}
          onSuccess={onMappingCreated}
        />
      )}
    </div>
  );
} 