
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlMapping } from '@/types/glsync';
import { AlertCircle } from 'lucide-react';

interface SyncDetailsPanelProps {
  mapping: GlMapping | null;
  error?: string;
}

const SyncDetailsPanel: React.FC<SyncDetailsPanelProps> = ({ mapping, error }) => {
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mapping Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-red-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!mapping) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mapping Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No mapping data available</p>
        </CardContent>
      </Card>
    );
  }

  // Safely access column_mappings
  let columnMappingsCount = 0;
  try {
    const columnMappings = typeof mapping.column_mappings === 'string' 
      ? JSON.parse(mapping.column_mappings) 
      : mapping.column_mappings;
    
    columnMappingsCount = Object.keys(columnMappings || {}).length;
  } catch (e) {
    console.error('Error parsing column mappings:', e);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapping Details</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Glide Table</dt>
            <dd className="text-lg">{mapping.glide_table_display_name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Supabase Table</dt>
            <dd className="text-lg">{mapping.supabase_table}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Sync Direction</dt>
            <dd className="text-lg">
              {mapping.sync_direction === 'to_supabase' ? 'Glide → Supabase' : 
               mapping.sync_direction === 'to_glide' ? 'Supabase → Glide' : 
               'Bidirectional'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Status</dt>
            <dd className="text-lg">
              <Badge className={mapping.enabled ? "bg-green-500" : "bg-gray-500"}>
                {mapping.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Column Mappings</dt>
            <dd className="text-lg">
              {columnMappingsCount > 0 
                ? `${columnMappingsCount} columns mapped` 
                : 'No column mappings defined'}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
};

export default SyncDetailsPanel;
