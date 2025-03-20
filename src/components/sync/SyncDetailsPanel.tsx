
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlMapping } from '@/types/glsync';

interface SyncDetailsPanelProps {
  mapping: GlMapping;
}

export function SyncDetailsPanel({ mapping }: SyncDetailsPanelProps) {
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
        </dl>
      </CardContent>
    </Card>
  );
}
