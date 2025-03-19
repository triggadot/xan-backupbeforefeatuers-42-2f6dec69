
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useGlSyncErrors } from '@/hooks/useGlSyncErrors';
import { useRealtimeMappings } from '@/hooks/useRealtimeMappings';
import { useRealtimeSyncLogs } from '@/hooks/useRealtimeSyncLogs';
import { syncService } from '@/services/glsync';
import { GlMapping } from '@/types/glsync';
import { GlConnection } from '@/types/syncLog';
import { Trash2, RefreshCw } from 'lucide-react';
import SyncLogTable from '../ui/SyncLogTable';
import ColumnMappingsView from './ColumnMappingsView';
import SyncDetailsPanel from './SyncDetailsPanel';
import SyncErrorsList from './SyncErrorsList';

const MappingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('column-mappings');
  const [includeResolved, setIncludeResolved] = useState(false);
  
  const { syncErrors, isLoading, resolveError, refreshErrors } = useGlSyncErrors(id);
  
  const { mapping, connection, isLoading: isMappingLoading, refetch } = useRealtimeMappings(id);
  const { logs, isLoading: isLogsLoading } = useRealtimeSyncLogs(id);

  if (isMappingLoading) {
    return <div className="p-4">Loading mapping details...</div>;
  }

  if (!mapping) {
    return <div className="p-4">Mapping not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{mapping.glide_table_display_name}</h1>
          <p className="text-muted-foreground">
            {mapping.app_name} → {mapping.supabase_table}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refreshErrors()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <SyncDetailsPanel mapping={mapping} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="column-mappings">Column Mappings</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="logs">Sync Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="column-mappings" className="mt-4">
          <ColumnMappingsView mapping={mapping} onSave={refetch} />
        </TabsContent>
        
        <TabsContent value="errors" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-md">Sync Errors</CardTitle>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="include-resolved" 
                    checked={includeResolved}
                    onCheckedChange={setIncludeResolved}
                  />
                  <Label htmlFor="include-resolved">Show resolved</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SyncErrorsList 
                errors={syncErrors} 
                isLoading={isLoading}
                onResolve={resolveError}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Sync History</CardTitle>
            </CardHeader>
            <CardContent>
              <SyncLogTable logs={logs} isLoading={isLogsLoading} />
            </CardContent>
            <CardFooter className="border-t px-6 py-3">
              <Button variant="outline" size="sm" className="ml-auto">
                View All Logs
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MappingDetails;
