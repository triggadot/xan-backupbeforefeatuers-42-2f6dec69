
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGlSyncErrors } from '@/hooks/useGlSyncErrors';
import { useGlSyncLogs } from '@/hooks/useGlSyncLogs';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';
import { GlMapping } from '@/types/glsync';
import { SyncProductsButton } from '../SyncProductsButton';
import { ColumnMappingsView } from './ColumnMappingsView';
import { SyncLogsView } from './SyncLogsView';
import { SyncErrorsView } from './SyncErrorsView';
import { SyncStatusDisplay } from '../SyncStatusDisplay';
import { ValidationDisplay } from '../ValidationDisplay';
import { useGlSyncValidation } from '@/hooks/useGlSyncValidation';
import { AlertCircle } from 'lucide-react';

export default function MappingDetails() {
  const { id } = useParams<{ id: string }>();
  const [mapping, setMapping] = useState<GlMapping | null>(null);
  const [connection, setConnection] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { syncErrors, refreshErrors } = useGlSyncErrors(id);
  const { syncLogs, refreshLogs } = useGlSyncLogs(id);
  const { syncStatus, refreshData: refreshStatus } = useGlSyncStatus(id);
  const { validateMappingConfig, validation } = useGlSyncValidation();

  const fetchMapping = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const { data: mappingData, error: mappingError } = await supabase
        .from('gl_mappings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (mappingError) throw mappingError;
      
      setMapping(mappingData as GlMapping);
      
      // Fetch associated connection
      if (mappingData.connection_id) {
        const { data: connectionData, error: connectionError } = await supabase
          .from('gl_connections')
          .select('*')
          .eq('id', mappingData.connection_id)
          .single();
        
        if (connectionError) throw connectionError;
        setConnection(connectionData);
      }
      
      // Validate mapping configuration
      if (mappingData) {
        validateMappingConfig(mappingData.id);
      }
    } catch (error) {
      console.error('Error fetching mapping:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch mapping details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMapping();
    
    // Subscribe to real-time changes
    if (id) {
      const channel = supabase
        .channel('mapping-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'gl_mappings', filter: `id=eq.${id}` },
          fetchMapping
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  const handleBack = () => {
    navigate('/sync/mappings');
  };

  const handleEdit = () => {
    navigate(`/sync/mappings/edit/${id}`);
  };

  const handleToggleEnabled = async () => {
    if (!mapping) return;
    
    try {
      const { data, error } = await supabase
        .from('gl_mappings')
        .update({ enabled: !mapping.enabled })
        .eq('id', mapping.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setMapping(data as GlMapping);
      
      toast({
        title: data.enabled ? 'Mapping enabled' : 'Mapping disabled',
        description: data.enabled 
          ? 'The mapping will now be used for synchronization' 
          : 'The mapping has been disabled and will not sync data',
      });
    } catch (error) {
      console.error('Error updating mapping:', error);
      toast({
        title: 'Error',
        description: 'Failed to update mapping status',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!mapping || !window.confirm('Are you sure you want to delete this mapping? This action cannot be undone.')) {
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
        description: 'The mapping has been successfully deleted',
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
    refreshStatus();
    refreshLogs();
    refreshErrors();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" disabled>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-8 w-60" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-80 mb-2" />
            <Skeleton className="h-4 w-full max-w-md" />
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

  if (!mapping) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Mappings
        </Button>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Mapping not found. It may have been deleted or you don't have access to it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Mappings
        </Button>
        
        <div className="flex space-x-2">
          <Button 
            variant={mapping.enabled ? "outline" : "default"} 
            size="sm"
            onClick={handleToggleEnabled}
          >
            {mapping.enabled ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Disable
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Enable
              </>
            )}
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                {mapping.glide_table_display_name}
                {!mapping.enabled && (
                  <Badge variant="outline" className="ml-2">Disabled</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Syncing {mapping.glide_table_display_name} with {mapping.supabase_table}
              </CardDescription>
            </div>
            
            <SyncProductsButton 
              mapping={mapping} 
              onSyncComplete={handleSyncComplete} 
            />
          </div>
        </CardHeader>
        <CardContent>
          {validation && (
            <div className="mb-4">
              <ValidationDisplay validation={validation} />
            </div>
          )}
          
          <div className="mb-6">
            <SyncStatusDisplay status={syncStatus} />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="mappings">Column Mappings</TabsTrigger>
              <TabsTrigger value="logs">Sync Logs</TabsTrigger>
              <TabsTrigger value="errors">
                Errors
                {syncErrors.length > 0 && (
                  <Badge variant="destructive" className="ml-2">{syncErrors.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Glide App</h3>
                  <p className="text-sm text-muted-foreground">{connection?.app_name || 'Unknown'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Sync Direction</h3>
                  <p className="text-sm text-muted-foreground">
                    {mapping.sync_direction === 'to_supabase' 
                      ? 'Glide to Supabase' 
                      : mapping.sync_direction === 'to_glide' 
                      ? 'Supabase to Glide' 
                      : 'Bidirectional'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Glide Table</h3>
                  <p className="text-sm text-muted-foreground">{mapping.glide_table_display_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">ID: {mapping.glide_table}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Supabase Table</h3>
                  <p className="text-sm text-muted-foreground">{mapping.supabase_table}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Created</h3>
                  <p className="text-sm text-muted-foreground">
                    {mapping.created_at ? new Date(mapping.created_at).toLocaleString() : 'Unknown'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Last Updated</h3>
                  <p className="text-sm text-muted-foreground">
                    {mapping.updated_at ? new Date(mapping.updated_at).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="mappings" className="mt-0">
              <ColumnMappingsView mapping={mapping} />
            </TabsContent>
            
            <TabsContent value="logs" className="mt-0">
              <SyncLogsView logs={syncLogs} onRefresh={refreshLogs} />
            </TabsContent>
            
            <TabsContent value="errors" className="mt-0">
              <SyncErrorsView 
                errors={syncErrors} 
                onRefresh={refreshErrors} 
                onResolve={async (errorId, notes) => {
                  const success = await supabase
                    .rpc('gl_resolve_sync_error', { 
                      p_error_id: errorId,
                      p_resolution_notes: notes || null
                    });
                  
                  if (success) {
                    refreshErrors();
                    return true;
                  }
                  return false;
                }} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
