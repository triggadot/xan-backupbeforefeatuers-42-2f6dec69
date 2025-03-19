
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlMapping } from '@/types/glsync';
import { AlertCircle } from 'lucide-react';

interface SyncDetailsPanelProps {
  mapping: GlMapping | null;
  error?: string;
}

export function SyncDetailsPanel({ mapping, error }: SyncDetailsPanelProps) {
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
              {mapping.column_mappings && Object.keys(mapping.column_mappings).length > 0 
                ? `${Object.keys(mapping.column_mappings).length} columns mapped` 
                : 'No column mappings defined'}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
