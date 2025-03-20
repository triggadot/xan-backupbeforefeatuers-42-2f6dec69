import React from 'react';
import { useProductMapping } from '@/hooks/useProductMapping';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ColumnMappingsView } from './ColumnMappingsView';
import { SyncErrorsView } from './SyncErrorsView';
import { SyncLogsView } from './SyncLogsView';
import { Button } from '@/components/ui/button';
import { MappingDebugView } from './MappingDebugView';
import { useGlSync } from '@/hooks/useGlSync';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MappingDetailsProps {
  mappingId: string;
  onBack: () => void;
}

const MappingDetails: React.FC<MappingDetailsProps> = ({ mappingId, onBack }) => {
  const { mapping, connection, isLoading, refetch } = useProductMapping(mappingId);
  const { syncData } = useGlSync();
  const { toast } = useToast();
  
  const handleTestSync = async () => {
    if (!mapping || !connection) return;
    
    toast({
      title: 'Starting sync test',
      description: 'Testing sync with current mapping configuration...',
    });
    
    try {
      const result = await syncData(connection.id, mapping.id);
      
      if (result.success) {
        toast({
          title: 'Sync successful',
          description: `Processed ${result.recordsProcessed} records with ${result.failedRecords} errors.`,
        });
      } else {
        toast({
          title: 'Sync failed',
          description: result.error || 'Unknown error during sync',
          variant: 'destructive',
        });
      }
      
      // Refresh mapping data after sync
      refetch();
    } catch (err) {
      console.error('Error during test sync:', err);
      toast({
        title: 'Sync error',
        description: err instanceof Error ? err.message : 'Unknown error during sync',
        variant: 'destructive',
      });
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!mapping) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium">Mapping not found</h3>
            <p className="text-muted-foreground mt-2">
              The mapping you're looking for doesn't exist or you don't have access to it.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mapping Details</CardTitle>
          <CardDescription>
            Configuration for syncing {mapping.glide_table_display_name} to {mapping.supabase_table}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium mb-2">Glide Configuration</h3>
              <dl className="grid grid-cols-2 gap-1 text-sm">
                <dt className="text-muted-foreground">App Name</dt>
                <dd>{connection?.app_name || 'Unnamed App'}</dd>
                <dt className="text-muted-foreground">Table Name</dt>
                <dd>{mapping.glide_table_display_name}</dd>
                <dt className="text-muted-foreground">Glide Table ID</dt>
                <dd className="font-mono text-xs">{mapping.glide_table}</dd>
              </dl>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Supabase Configuration</h3>
              <dl className="grid grid-cols-2 gap-1 text-sm">
                <dt className="text-muted-foreground">Table Name</dt>
                <dd>{mapping.supabase_table}</dd>
                <dt className="text-muted-foreground">Sync Direction</dt>
                <dd>{mapping.sync_direction}</dd>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${mapping.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {mapping.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </dd>
              </dl>
            </div>
          </div>
          
          <div className="mt-6 flex space-x-2">
            <Button onClick={handleTestSync}>
              Test Sync
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="column-mappings">
        <TabsList>
          <TabsTrigger value="column-mappings">Column Mappings</TabsTrigger>
          <TabsTrigger value="sync-logs">Sync Logs</TabsTrigger>
          <TabsTrigger value="sync-errors">Sync Errors</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>
        
        <TabsContent value="column-mappings">
          <Card>
            <CardHeader>
              <CardTitle>Column Mappings</CardTitle>
              <CardDescription>
                How fields are mapped between Glide and Supabase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ColumnMappingsView mapping={mapping} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sync-logs">
          <SyncLogsView mappingId={mapping.id} />
        </TabsContent>
        
        <TabsContent value="sync-errors">
          <SyncErrorsView mappingId={mapping.id} />
        </TabsContent>
        
        <TabsContent value="debug">
          <MappingDebugView mapping={mapping} onTestSync={handleTestSync} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MappingDetails;
