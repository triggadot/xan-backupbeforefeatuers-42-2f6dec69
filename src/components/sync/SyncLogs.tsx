
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SyncLogsList } from './logs/SyncLogsList';
import { useRealtimeMappings } from '@/hooks/useRealtimeMappings';
import { useConnections } from '@/hooks/useConnections';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SyncLogs() {
  const [selectedMapping, setSelectedMapping] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const { mappings, isLoading: isMappingsLoading } = useRealtimeMappings();
  const { connections, isLoading: isConnectionsLoading } = useConnections();

  const filteredMappings = selectedConnection 
    ? mappings.filter(mapping => mapping.connection_id === selectedConnection)
    : mappings;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
        <div className="w-full sm:w-1/3">
          <Select
            value={selectedConnection || ''}
            onValueChange={(value) => {
              setSelectedConnection(value === '' ? null : value);
              setSelectedMapping(null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Connections" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="">All Connections</SelectItem>
                {connections.map((connection) => (
                  <SelectItem key={connection.id} value={connection.id}>
                    {connection.app_name || 'Unnamed App'}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-1/3">
          <Select
            value={selectedMapping || ''}
            onValueChange={(value) => setSelectedMapping(value === '' ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Mappings" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="">All Mappings</SelectItem>
                {filteredMappings.map((mapping) => (
                  <SelectItem key={mapping.id} value={mapping.id}>
                    {mapping.glide_table_display_name} → {mapping.supabase_table}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <SyncLogsList mappingId={selectedMapping} limit={50} />
    </div>
  );
}
