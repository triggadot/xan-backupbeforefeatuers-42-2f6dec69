
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SyncStatusBadge } from '@/components/sync/ui/SyncStatusBadge';
import { formatTimestamp } from '@/utils/glsync-transformers';
import { GlMapping } from '@/types/glsync';

interface SyncDetailsPanelProps {
  mapping: GlMapping;
}

const SyncDetailsPanel: React.FC<SyncDetailsPanelProps> = ({ mapping }) => {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Sync Status</h3>
            <div className="mt-1">
              <SyncStatusBadge status={mapping.current_status || 'unknown'} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Last Synced</h3>
            <p className="mt-1 text-sm">
              {formatTimestamp(mapping.last_sync_completed_at)}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Records</h3>
            <p className="mt-1 text-sm">{mapping.total_records || 0} total</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Errors</h3>
            <p className="mt-1 text-sm">{mapping.error_count || 0} errors</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncDetailsPanel;
