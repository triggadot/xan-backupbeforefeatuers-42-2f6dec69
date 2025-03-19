
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Cog, RefreshCw } from 'lucide-react';
import { MappingTabs } from '@/components/sync/MappingTabs';
import { SyncControlPanel } from '@/components/sync/SyncControlPanel';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GlMapping } from '@/types/glsync';
import { convertToGlMapping } from '@/utils/gl-mapping-converters';
import { LoadingState } from '@/components/sync/LoadingState';
import { InvalidMapping } from '@/components/sync/InvalidMapping';
import ColumnMappingsView from './ColumnMappingsView';
import { SyncLogsView } from './SyncLogsView';
import SyncErrorsView from './SyncErrorsView';
import { glSyncApi } from '@/services/glsync';

interface MappingDetailsProps {
  mappingId: string;
  onBack: () => void;
}

const MappingDetails: React.FC<MappingDetailsProps> = ({ mappingId, onBack }) => {
  const [mapping, setMapping] = useState<GlMapping | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('columns');
  const { toast } = useToast();

  const fetchMapping = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gl_mappings')
        .select('*, gl_connections(app_name)')
        .eq('id', mappingId)
        .single();
      
      if (error) throw error;
      
      const mappingData = convertToGlMapping({
        ...data,
        app_name: data.gl_connections?.app_name
      });
      
      setMapping(mappingData);
    } catch (error) {
      console.error('Error fetching mapping:', error);
      toast({
        title: 'Error',
        description: 'Failed to load mapping details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMapping();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('mapping_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'gl_mappings',
        filter: `id=eq.${mappingId}`
      }, () => {
        fetchMapping();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [mappingId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMapping();
    setIsRefreshing(false);
  };

  const handleSync = async () => {
    if (!mapping) return;
    
    setIsSyncing(true);
    try {
      const response = await glSyncApi.syncData(mapping.connection_id, mapping.id);
      
      if (response.success) {
        toast({
          title: 'Sync Started',
          description: `Processing ${response.result?.recordsProcessed || 0} records`,
        });
      } else {
        toast({
          title: 'Sync Failed',
          description: response.error || 'Failed to start sync',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sync data',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleMappingEnabled = async () => {
    if (!mapping) return;
    
    try {
      const { error } = await supabase
        .from('gl_mappings')
        .update({ enabled: !mapping.enabled })
        .eq('id', mapping.id);
      
      if (error) throw error;
      
      toast({
        title: mapping.enabled ? 'Mapping Disabled' : 'Mapping Enabled',
        description: mapping.enabled 
          ? 'The mapping will no longer sync automatically' 
          : 'The mapping will now sync automatically',
      });
      
      // Refresh mapping data
      await fetchMapping();
    } catch (error) {
      console.error('Error toggling mapping status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update mapping status',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!mapping) {
    return <InvalidMapping onBack={onBack} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="ml-1">Back</span>
            </Button>
            <h1 className="text-2xl font-semibold">Mapping Details</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {mapping.glide_table_display_name} ↔ {mapping.supabase_table}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleMappingEnabled}
            className="h-8"
          >
            <Cog className="h-4 w-4 mr-2" />
            {mapping.enabled ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Mapping Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="columns">Column Mappings</TabsTrigger>
                  <TabsTrigger value="logs">Sync Logs</TabsTrigger>
                  <TabsTrigger value="errors">Errors</TabsTrigger>
                </TabsList>
                
                <TabsContent value="columns" className="space-y-4">
                  <ColumnMappingsView mapping={mapping} />
                </TabsContent>
                
                <TabsContent value="logs">
                  <SyncLogsView mappingId={mapping.id} />
                </TabsContent>
                
                <TabsContent value="errors">
                  <SyncErrorsView mappingId={mapping.id} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <MappingTabs
            mapping={mapping}
            onSync={handleSync}
            isSyncing={isSyncing}
          />
        </div>
      </div>
    </div>
  );
};

export default MappingDetails;
