
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Edit, Play, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SyncStatusBadge } from '@/components/sync/ui/SyncStatusBadge';
import { Mapping } from '@/types/syncLog';
import { formatDateTime } from '@/utils/date-utils';

const MappingDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [mapping, setMapping] = useState<Mapping>({
    id: '',
    connection_id: '',
    glide_table: '',
    glide_table_display_name: '',
    supabase_table: '',
    column_mappings: {},
    sync_direction: '',
    enabled: false
  });
  const [statusInfo, setStatusInfo] = useState({
    current_status: '',
    last_sync_completed_at: null as string | null,
    records_processed: 0,
    error_count: 0,
    total_records: 0
  });

  const fetchMapping = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      // Fetch the mapping data
      const { data: mappingData, error: mappingError } = await supabase
        .from('gl_mappings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (mappingError) throw mappingError;
      
      // Fetch the status information
      const { data: statusData, error: statusError } = await supabase
        .from('gl_mapping_status')
        .select('*')
        .eq('mapping_id', id)
        .single();
      
      // Transform data to ensure correct types
      const transformedMapping: Mapping = {
        id: mappingData.id,
        connection_id: mappingData.connection_id,
        glide_table: mappingData.glide_table,
        glide_table_display_name: mappingData.glide_table_display_name,
        supabase_table: mappingData.supabase_table,
        column_mappings: typeof mappingData.column_mappings === 'string' 
          ? JSON.parse(mappingData.column_mappings) 
          : mappingData.column_mappings,
        sync_direction: mappingData.sync_direction,
        enabled: mappingData.enabled,
        created_at: mappingData.created_at,
        updated_at: mappingData.updated_at
      };
      
      setMapping(transformedMapping);
      
      if (!statusError && statusData) {
        setStatusInfo({
          current_status: statusData.current_status || '',
          last_sync_completed_at: statusData.last_sync_completed_at,
          records_processed: statusData.records_processed || 0,
          error_count: statusData.error_count || 0,
          total_records: statusData.total_records || 0
        });
      }
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

  useEffect(() => {
    fetchMapping();
    
    // Set up realtime subscription for mapping status updates
    const statusChannel = supabase
      .channel('mapping_status_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gl_mapping_status', filter: `mapping_id=eq.${id}` }, 
        () => {
          fetchMapping();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, [id]);

  const triggerSync = async () => {
    if (!id) return;
    
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'syncData',
          mappingId: id
        },
      });

      if (error) throw error;
      
      if (data.success) {
        toast({
          title: 'Sync started',
          description: 'Synchronization has been initiated',
        });
      } else {
        toast({
          title: 'Sync failed to start',
          description: data.error || 'An error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error starting sync:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoBack = () => {
    navigate('/sync/mappings');
  };

  const handleEdit = () => {
    navigate(`/sync/mappings/${id}/edit`);
  };

  const getSyncDirectionLabel = (direction: string) => {
    switch (direction) {
      case 'to_supabase':
        return <Badge className="bg-blue-500">Glide → Supabase</Badge>;
      case 'to_glide':
        return <Badge className="bg-purple-500">Supabase → Glide</Badge>;
      case 'both':
        return <Badge className="bg-green-500">Bidirectional</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={handleGoBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={handleGoBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-semibold">
            {mapping.glide_table_display_name || mapping.glide_table} → {mapping.supabase_table}
          </h2>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchMapping}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          
          <Button 
            onClick={triggerSync} 
            disabled={isSyncing || !mapping.enabled}
          >
            <Play className="h-4 w-4 mr-2" />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="mappings">Field Mappings</TabsTrigger>
          <TabsTrigger value="logs">Sync Logs</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Mapping Details</CardTitle>
              <CardDescription>
                Configuration and status information for this table mapping
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-1">Sync Configuration</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">Direction:</div>
                      <div>{getSyncDirectionLabel(mapping.sync_direction)}</div>
                      
                      <div className="text-sm text-muted-foreground">Status:</div>
                      <div>
                        {mapping.enabled ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">Created:</div>
                      <div className="text-sm">{formatDateTime(mapping.created_at)}</div>
                      
                      <div className="text-sm text-muted-foreground">Last Updated:</div>
                      <div className="text-sm">{formatDateTime(mapping.updated_at)}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">Table Information</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">Glide Table:</div>
                      <div className="text-sm">{mapping.glide_table_display_name || mapping.glide_table}</div>
                      
                      <div className="text-sm text-muted-foreground">Glide Table ID:</div>
                      <div className="text-sm">{mapping.glide_table}</div>
                      
                      <div className="text-sm text-muted-foreground">Supabase Table:</div>
                      <div className="text-sm">{mapping.supabase_table}</div>
                      
                      <div className="text-sm text-muted-foreground">Mapped Fields:</div>
                      <div className="text-sm">{Object.keys(mapping.column_mappings).length}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-1">Sync Status</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">Current Status:</div>
                      <div><SyncStatusBadge status={statusInfo.current_status} /></div>
                      
                      <div className="text-sm text-muted-foreground">Last Sync:</div>
                      <div className="text-sm">{formatDateTime(statusInfo.last_sync_completed_at)}</div>
                      
                      <div className="text-sm text-muted-foreground">Records Processed:</div>
                      <div className="text-sm">{statusInfo.records_processed}</div>
                      
                      <div className="text-sm text-muted-foreground">Total Records:</div>
                      <div className="text-sm">{statusInfo.total_records}</div>
                      
                      <div className="text-sm text-muted-foreground">Errors:</div>
                      <div className="text-sm">{statusInfo.error_count}</div>
                    </div>
                  </div>
                  
                  {!mapping.enabled && (
                    <Card className="bg-amber-50 border border-amber-200">
                      <CardContent className="p-4 flex items-start space-x-2">
                        <HelpCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-amber-900">Mapping Disabled</h4>
                          <p className="text-sm text-amber-700">
                            This mapping is currently disabled. Enable it to allow synchronization.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="mappings">
          <Card>
            <CardHeader>
              <CardTitle>Field Mappings</CardTitle>
              <CardDescription>
                Configuration for how fields are mapped between Glide and Supabase
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Field mappings content will go here */}
              <p className="text-muted-foreground">Field mapping details will be shown here</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Sync Logs</CardTitle>
              <CardDescription>
                History of synchronization operations for this mapping
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Logs content will go here */}
              <p className="text-muted-foreground">Sync logs will be shown here</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Sync Errors</CardTitle>
              <CardDescription>
                Error details and resolution options
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Errors content will go here */}
              <p className="text-muted-foreground">Sync errors will be shown here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MappingDetails;
