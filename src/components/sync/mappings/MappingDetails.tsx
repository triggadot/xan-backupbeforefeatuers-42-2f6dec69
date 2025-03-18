import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { GlMapping } from '@/types/glsync';
import { supabase } from '@/integrations/supabase/client';
import { ColumnMappingsView } from './ColumnMappingsView';
import { SyncLogsView } from './SyncLogsView';
import { SyncErrorsView } from './SyncErrorsView';
import SyncProductsButton from "../SyncProductsButton";
import { ArrowLeft, Plus, PlusCircle } from 'lucide-react';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';
import { useGlSyncErrors } from '@/hooks/useGlSyncErrors';
import { CreateTableForm } from './CreateTableForm';
import { EditTableButton } from './EditTableButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSupabaseTables } from '@/hooks/useSupabaseTables';
import { SupabaseTableSelector } from './SupabaseTableSelector';

interface MappingDetailsProps {
  mappingId: string;
  onBack?: () => void;
}

const MappingDetails = ({ mappingId, onBack }: MappingDetailsProps) => {
  const [mapping, setMapping] = useState<GlMapping | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTableDialog, setShowCreateTableDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { syncStatus, refreshStatus } = useGlSyncStatus(mappingId);
  const { 
    syncErrors, 
    resolveError, 
    includeResolved, 
    setIncludeResolved, 
    refreshErrors 
  } = useGlSyncErrors(mappingId);
  const { tables: supabaseTables, fetchTables, isLoading: isLoadingTables } = useSupabaseTables();

  useEffect(() => {
    fetchMapping();

    // Subscribe to changes in the gl_mappings table for this mapping
    const channel = supabase
      .channel(`mapping-${mappingId}-changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gl_mappings', filter: `id=eq.${mappingId}` },
        fetchMapping
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mappingId]);

  const fetchMapping = async () => {
    if (!mappingId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gl_mappings')
        .select('*, gl_connections(*)')
        .eq('id', mappingId)
        .single();
      
      if (error) throw error;
      
      // Convert the JSON data to the proper GlMapping type
      const mappingData = {
        ...data,
        column_mappings: data.column_mappings as Record<string, {
          glide_column_name: string;
          supabase_column_name: string;
          data_type: 'string' | 'number' | 'boolean' | 'date-time' | 'image-uri' | 'email-address';
        }>
      } as GlMapping;
      
      setMapping(mappingData);
    } catch (error) {
      console.error('Error fetching mapping details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load mapping details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMapping = async () => {
    if (!mapping) return;
    
    try {
      const { error } = await supabase
        .from('gl_mappings')
        .update({
          enabled: !mapping.enabled,
        })
        .eq('id', mapping.id);
      
      if (error) throw error;
      
      // Update local state (though the real-time subscription should handle this)
      setMapping(prev => prev ? { ...prev, enabled: !prev.enabled } : null);
      
      toast({
        title: `Mapping ${!mapping.enabled ? 'enabled' : 'disabled'}`,
        description: `The table mapping has been ${!mapping.enabled ? 'enabled' : 'disabled'} successfully.`,
      });
    } catch (error) {
      console.error('Error toggling mapping status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update mapping status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMapping = async () => {
    if (!mapping) return;
    
    if (!window.confirm('Are you sure you want to delete this mapping?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('gl_mappings')
        .delete()
        .eq('id', mapping.id);
      
      if (error) throw error;
      
      toast({
        title: 'Mapping deleted',
        description: 'The table mapping has been deleted successfully.',
      });
      navigate('/sync/mappings');
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete mapping',
        variant: 'destructive',
      });
    }
  };

  const handleSyncComplete = () => {
    // Refresh the mapping data to get updated sync status
    refreshStatus();
  };

  const handleTableCreated = (tableName: string) => {
    setShowCreateTableDialog(false);
    fetchTables();
    toast({
      title: 'Table Created',
      description: `Table ${tableName} has been created successfully.`
    });

    // If we don't have a mapping yet, update the mapping details
    if (mapping && mapping.supabase_table !== tableName) {
      updateMappingTable(tableName);
    }
  };

  const handleTableUpdated = () => {
    fetchTables();
    toast({
      title: 'Success',
      description: 'Table schema has been updated.'
    });
  };

  const updateMappingTable = async (tableName: string) => {
    if (!mapping) return;

    try {
      const { error } = await supabase
        .from('gl_mappings')
        .update({ supabase_table: tableName })
        .eq('id', mappingId);

      if (error) throw error;

      toast({
        title: 'Mapping Updated',
        description: `Mapping now uses table ${tableName}`
      });

      // Refresh the mapping data
      fetchMapping();
    } catch (error) {
      console.error('Error updating mapping:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update mapping',
        variant: 'destructive'
      });
    }
  };

  const handleSupabaseTableChange = (tableName: string) => {
    if (mapping && mapping.supabase_table !== tableName) {
      updateMappingTable(tableName);
    }
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle className="h-7 bg-gray-200 rounded"></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        </CardContent>
      </Card>
    );
  }

  if (!mapping) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mapping Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The requested mapping could not be found.</p>
          <Button onClick={() => navigate('/sync/mappings')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Mappings
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBack ? onBack : () => navigate('/sync/mappings')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-semibold">{mapping.glide_table_display_name}</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Mapping between {mapping.glide_table_display_name} and {mapping.supabase_table}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={mapping.enabled ? "outline" : "default"}
            onClick={handleToggleMapping}
          >
            {mapping.enabled ? 'Disable' : 'Enable'}
          </Button>
          
          {mapping.supabase_table === 'gl_products' && (
            <SyncProductsButton 
              mapping={mapping} 
              onSyncComplete={handleSyncComplete}
            />
          )}
          
          <Button 
            variant="destructive" 
            onClick={handleDeleteMapping}
          >
            Delete
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="column-mappings">Column Mappings</TabsTrigger>
          <TabsTrigger value="table-schema">Table Schema</TabsTrigger>
          <TabsTrigger value="sync-logs">Sync Logs</TabsTrigger>
          <TabsTrigger value="sync-errors">Sync Errors</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Mapping Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <dd className="text-lg">{mapping.enabled ? 'Enabled' : 'Disabled'}</dd>
                </div>
                {syncStatus && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Last Sync</dt>
                  <dd className="text-lg">
                    {syncStatus.last_sync_completed_at ? 
                      new Date(syncStatus.last_sync_completed_at).toLocaleString() : 
                      'Never'}
                  </dd>
                </div>
                )}
                {syncStatus && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Records Processed</dt>
                  <dd className="text-lg">{syncStatus.records_processed || 0}</dd>
                </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="column-mappings" className="pt-4">
          <ColumnMappingsView mapping={mapping} />
        </TabsContent>
        
        <TabsContent value="table-schema" className="pt-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Create Table Section */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Table</CardTitle>
                <CardDescription>
                  Create a new Supabase table and update this mapping
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => setShowCreateTableDialog(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create New Table
                </Button>
                
                <Dialog open={showCreateTableDialog} onOpenChange={setShowCreateTableDialog}>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Supabase Table</DialogTitle>
                    </DialogHeader>
                    <CreateTableForm 
                      onTableCreated={handleTableCreated}
                      onCancel={() => setShowCreateTableDialog(false)}
                    />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
            
            {/* View Existing Tables Section */}
            <Card>
              <CardHeader>
                <CardTitle>Change Table</CardTitle>
                <CardDescription>
                  Switch this mapping to use a different table
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <SupabaseTableSelector
                    tables={supabaseTables}
                    value={mapping.supabase_table}
                    onTableChange={handleSupabaseTableChange}
                    filterPrefix="gl_"
                    isLoading={isLoadingTables}
                    placeholder="Select a table"
                    onCreateTableSuccess={handleTableCreated}
                  />
                  
                  <EditTableButton 
                    onTableUpdated={handleTableUpdated}
                    initialTableName={mapping.supabase_table}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="sync-logs" className="pt-4">
          <SyncLogsView mappingId={mappingId} />
        </TabsContent>
        
        <TabsContent value="sync-errors" className="pt-4">
          <SyncErrorsView 
            syncErrors={syncErrors}
            onResolve={resolveError}
            onRefresh={refreshErrors}
            onToggleShowResolved={setIncludeResolved}
            includeResolved={includeResolved}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MappingDetails;
