
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  RefreshCw, 
  Edit,
  AlertCircle, 
  CheckCircle,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SyncLogsTable } from '../logs/SyncLogsTable';
import { formatDateTime } from '@/utils/date-utils';
import { SyncStatusBadge } from '../ui/SyncStatusBadge';

interface Mapping {
  id: string;
  connection_id: string;
  app_name: string;
  glide_table: string;
  glide_table_display_name: string;
  supabase_table: string;
  enabled: boolean;
  sync_direction: string;
  column_mappings: Record<string, { 
    glide_column_name: string;
    supabase_column_name: string;
    data_type: string;
  }>;
}

interface SyncStatus {
  current_status: string;
  last_sync_completed_at: string | null;
  records_processed: number;
  total_records: number;
  error_count: number;
}

interface SyncLog {
  id: string;
  mapping_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  message: string | null;
  records_processed: number | null;
}

const MappingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchMapping = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      // Fetch the mapping
      const { data: mappingData, error: mappingError } = await supabase
        .from('gl_mappings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (mappingError) throw mappingError;
      
      // Fetch the connection details to get the app name
      const { data: connectionData, error: connectionError } = await supabase
        .from('gl_connections')
        .select('app_name')
        .eq('id', mappingData.connection_id)
        .single();
      
      if (connectionError) throw connectionError;
      
      // Fetch the sync status
      const { data: statusData, error: statusError } = await supabase
        .from('gl_mapping_status')
        .select('*')
        .eq('mapping_id', id)
        .maybeSingle();
      
      if (statusError) throw statusError;
      
      // Combine data
      setMapping({
        ...mappingData,
        app_name: connectionData.app_name
      });
      
      setSyncStatus(statusData || null);
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

  const fetchSyncLogs = async () => {
    if (!id) return;
    
    setIsLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('gl_sync_logs')
        .select('*')
        .eq('mapping_id', id)
        .order('started_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchMapping();
    fetchSyncLogs();
    
    // Set up realtime subscriptions
    if (id) {
      const statusChannel = supabase
        .channel('gl_mapping_status_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'gl_mapping_status', filter: `mapping_id=eq.${id}` }, 
          () => {
            fetchMapping();
          }
        )
        .subscribe();
      
      const logsChannel = supabase
        .channel('gl_logs_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'gl_sync_logs', filter: `mapping_id=eq.${id}` }, 
          () => {
            fetchSyncLogs();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(statusChannel);
        supabase.removeChannel(logsChannel);
      };
    }
  }, [id]);

  const handleSync = async () => {
    if (!mapping) return;
    
    setIsSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'syncData',
          mappingId: mapping.id,
        },
      });
      
      if (error) throw error;
      
      toast({
        title: 'Sync started',
        description: 'Data synchronization has been initiated',
      });
      
      // Refresh the data after a short delay
      setTimeout(() => {
        fetchMapping();
        fetchSyncLogs();
      }, 2000);
    } catch (error) {
      console.error('Error syncing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to start sync operation',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleEnabled = async () => {
    if (!mapping) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('gl_mappings')
        .update({ enabled: !mapping.enabled })
        .eq('id', mapping.id);
      
      if (error) throw error;
      
      // Show toast
      toast({
        title: mapping.enabled ? 'Mapping disabled' : 'Mapping enabled',
        description: `Sync for ${mapping.glide_table_display_name} has been ${mapping.enabled ? 'disabled' : 'enabled'}`,
      });
      
      // Refresh mapping
      fetchMapping();
    } catch (error) {
      console.error('Error toggling mapping:', error);
      toast({
        title: 'Error',
        description: 'Failed to update mapping',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const renderSyncProgress = () => {
    if (!syncStatus) return null;
    
    const progress = syncStatus.total_records 
      ? Math.min(Math.round((syncStatus.records_processed / syncStatus.total_records) * 100), 100) 
      : 0;
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 mt-2">
        <div 
          className="bg-blue-600 h-2 rounded-full" 
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  };

  const renderColumnMappings = () => {
    if (!mapping || !mapping.column_mappings) return null;
    
    return (
      <div className="border rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Glide Column
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supabase Column
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Type
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(mapping.column_mappings).map(([glideColumnId, columnMapping]) => (
              <tr key={glideColumnId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {columnMapping.glide_column_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {columnMapping.supabase_column_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {columnMapping.data_type}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSyncDirection = (direction: string) => {
    switch (direction) {
      case 'to_supabase':
        return <Badge>Glide → Supabase</Badge>;
      case 'to_glide':
        return <Badge>Supabase → Glide</Badge>;
      case 'both':
        return <Badge>Bidirectional</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2 mb-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-2/3 mb-6" />
            <div className="flex justify-end">
              <Skeleton className="h-10 w-28 ml-2" />
              <Skeleton className="h-10 w-28 ml-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!mapping) {
    return (
      <div>
        <Button variant="ghost" onClick={() => navigate('/sync/mappings')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Mappings
        </Button>
        <Card className="mt-4 p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Mapping not found</h3>
          <p className="text-muted-foreground mt-2">The mapping you're looking for does not exist or has been deleted.</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate('/sync/mappings')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Mappings
      </Button>
      
      <div className="mt-4">
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex items-center gap-3">
                <CardTitle>{mapping.glide_table_display_name}</CardTitle>
                {renderSyncDirection(mapping.sync_direction)}
                <SyncStatusBadge status={syncStatus?.current_status || null} />
              </div>
              <div className="flex items-center mt-2 md:mt-0">
                <div className="flex items-center mr-4">
                  <Switch
                    checked={mapping.enabled}
                    onCheckedChange={handleToggleEnabled}
                    disabled={isUpdating}
                    className="mr-2"
                  />
                  <span className="text-sm flex items-center">
                    {mapping.enabled ? (
                      <>
                        <ToggleRight className="h-5 w-5 text-green-500 mr-1" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-5 w-5 text-gray-400 mr-1" />
                        Disabled
                      </>
                    )}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate(`/sync/mappings/edit/${mapping.id}`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-1">
              App: {mapping.app_name || 'Unnamed App'}
            </div>
            <div className="text-sm text-muted-foreground mb-1">
              Supabase Table: {mapping.supabase_table}
            </div>
            <div className="text-sm text-muted-foreground mb-3">
              Last Sync: {syncStatus?.last_sync_completed_at ? formatDateTime(syncStatus.last_sync_completed_at) : 'Never'}
            </div>
            
            {renderSyncProgress()}
            
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                {syncStatus?.error_count ? (
                  <span className="text-red-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {syncStatus.error_count} error{syncStatus.error_count !== 1 ? 's' : ''}
                  </span>
                ) : syncStatus?.records_processed ? (
                  <span className="text-green-500 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {syncStatus.records_processed} record{syncStatus.records_processed !== 1 ? 's' : ''} processed
                  </span>
                ) : null}
              </div>
              <Button 
                onClick={handleSync}
                disabled={isSyncing || !mapping.enabled || syncStatus?.current_status === 'processing'}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="columnMappings">Column Mappings</TabsTrigger>
            <TabsTrigger value="syncLogs">Sync Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Sync Details</h3>
                    <p><strong>Glide Table:</strong> {mapping.glide_table_display_name}</p>
                    <p><strong>Supabase Table:</strong> {mapping.supabase_table}</p>
                    <p><strong>Sync Direction:</strong> {mapping.sync_direction}</p>
                    <p><strong>Status:</strong> {mapping.enabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Sync Status</h3>
                    <p><strong>Current Status:</strong> {syncStatus?.current_status || 'Unknown'}</p>
                    <p><strong>Last Sync:</strong> {syncStatus?.last_sync_completed_at ? formatDateTime(syncStatus.last_sync_completed_at) : 'Never'}</p>
                    <p><strong>Records Processed:</strong> {syncStatus?.records_processed || 0}</p>
                    <p><strong>Errors:</strong> {syncStatus?.error_count || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="columnMappings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Column Mappings</CardTitle>
              </CardHeader>
              <CardContent>
                {renderColumnMappings()}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="syncLogs" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Sync Logs</CardTitle>
                <Button variant="outline" size="sm" onClick={fetchSyncLogs} disabled={isLoadingLogs}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingLogs ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <SyncLogsTable logs={syncLogs} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MappingDetails;
