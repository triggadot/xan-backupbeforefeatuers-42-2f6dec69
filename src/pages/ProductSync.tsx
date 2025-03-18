
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, AlertCircle, RotateCcw, RefreshCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { glSyncApi } from '@/services/glsync';
import { GlMapping, GlConnection, GlSyncLog } from '@/types/glsync';
import MappingDetailsCard from '@/components/sync/MappingDetailsCard';
import ColumnMappingEditor from '@/components/sync/ColumnMappingEditor';
import SyncProductsButton from '@/components/sync/SyncProductsButton';

const ProductSync = () => {
  const { mappingId } = useParams<{ mappingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('details');
  const [mapping, setMapping] = useState<GlMapping | null>(null);
  const [connection, setConnection] = useState<GlConnection | null>(null);
  const [syncLogs, setSyncLogs] = useState<GlSyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, [mappingId]);

  const loadData = async () => {
    if (!mappingId) {
      setError('No mapping ID provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load mapping data
      const mappingData = await glSyncApi.getMapping(mappingId);
      setMapping(mappingData);

      // Load connection data
      const connectionData = await glSyncApi.getConnection(mappingData.connection_id);
      setConnection(connectionData);

      // Load sync logs
      const logsData = await glSyncApi.getSyncLogs(mappingId, 10);
      setSyncLogs(logsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load product sync data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleColumnMappingUpdate = async (updatedColumnMappings: { column_mappings: Record<string, any> }) => {
    if (!mapping) return;

    try {
      const updatedMapping = await glSyncApi.updateMapping(mapping.id, {
        column_mappings: updatedColumnMappings.column_mappings
      });
      
      setMapping(updatedMapping);
      
      toast({
        title: 'Column mappings updated',
        description: 'The column mappings have been successfully updated',
      });
    } catch (err) {
      console.error('Error updating column mappings:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update column mappings',
        variant: 'destructive',
      });
    }
  };

  const handleSyncComplete = () => {
    loadData();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading product sync data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 max-w-7xl">
        <Button 
          variant="outline" 
          onClick={() => navigate('/sync/mappings')} 
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Mappings
        </Button>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!mapping || !connection) {
    return (
      <div className="container mx-auto py-6 max-w-7xl">
        <Button 
          variant="outline" 
          onClick={() => navigate('/sync/mappings')} 
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Mappings
        </Button>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The requested mapping or connection could not be found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/sync/mappings')} 
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">
              Product Sync: {mapping.glide_table_display_name || mapping.glide_table}
            </h1>
            <p className="text-muted-foreground">
              {connection.app_name || 'Unnamed App'} · {mapping.supabase_table}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={loadData}
            disabled={isLoading}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          
          <SyncProductsButton 
            mapping={mapping}
            onSyncComplete={handleSyncComplete}
          />
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="column-mappings">Column Mappings</TabsTrigger>
          <TabsTrigger value="sync-logs">Sync Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <MappingDetailsCard 
            mapping={mapping} 
            connectionName={connection.app_name || 'Unnamed App'}
            onSyncComplete={handleSyncComplete}
          />
          
          {mapping.supabase_table !== 'gl_products' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Note</AlertTitle>
              <AlertDescription>
                This mapping is not using the gl_products table. For Glide products, it's recommended to use the gl_products table for optimal compatibility.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        <TabsContent value="column-mappings" className="space-y-4">
          <ColumnMappingEditor 
            mapping={mapping} 
            onUpdate={handleColumnMappingUpdate}
          />
        </TabsContent>
        
        <TabsContent value="sync-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync History</CardTitle>
              <CardDescription>
                Recent sync operations for this product mapping
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {syncLogs.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center">
                  No sync logs found. Start a sync to see results here.
                </p>
              ) : (
                <div className="space-y-4">
                  {syncLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-4 rounded-md ${
                        log.status === 'completed' 
                          ? 'bg-green-50 border border-green-100' 
                          : log.status === 'failed'
                          ? 'bg-red-50 border border-red-100'
                          : 'bg-orange-50 border border-orange-100'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {log.status === 'completed' ? 'Sync Completed' : 
                             log.status === 'failed' ? 'Sync Failed' : 
                             log.status === 'processing' ? 'Processing' : 'Started'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(log.started_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge className={
                          log.status === 'completed' ? 'bg-green-500' : 
                          log.status === 'failed' ? 'bg-red-500' : 
                          'bg-orange-500'
                        }>
                          {log.status}
                        </Badge>
                      </div>
                      
                      {log.message && (
                        <p className="mt-2 text-sm">{log.message}</p>
                      )}
                      
                      {log.records_processed !== null && (
                        <p className="mt-1 text-sm">
                          Records processed: {log.records_processed}
                        </p>
                      )}
                      
                      {log.completed_at && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Completed: {new Date(log.completed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductSync;
