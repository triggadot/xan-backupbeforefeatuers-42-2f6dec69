import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Edit2, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/utils/use-toast';
import { GlConnection } from '@/types/glide-sync/glsync';
import { glSyncService } from '@/services/glsync';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import SyncContainer from './SyncContainer';
import { createLogger } from '@/services/logger';

const logger = createLogger('ConnectionsManager');

/**
 * Props for the ConnectionForm component
 */
interface ConnectionFormProps {
  onSubmit: (data: Partial<GlConnection>) => void;
  initialData?: Partial<GlConnection>;
}

/**
 * Form component for adding or editing Glide connections
 */
const ConnectionForm: React.FC<ConnectionFormProps> = ({ onSubmit, initialData }) => {
  const [appId, setAppId] = useState(initialData?.app_id || '');
  const [apiKey, setApiKey] = useState(initialData?.api_key || '');
  const [appName, setAppName] = useState(initialData?.app_name || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit({
        app_id: appId,
        api_key: apiKey,
        app_name: appName,
        ...(initialData?.id ? { id: initialData.id } : {}),
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit form',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="appName">App Name</Label>
        <Input
          type="text"
          id="appName"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          placeholder="My Glide App"
        />
        <p className="text-xs text-muted-foreground mt-1">
          A friendly name to identify this connection
        </p>
      </div>
      <div>
        <Label htmlFor="appId">App ID</Label>
        <Input
          type="text"
          id="appId"
          value={appId}
          onChange={(e) => setAppId(e.target.value)}
          placeholder="Enter your Glide App ID"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Found in your Glide app settings
        </p>
      </div>
      <div>
        <Label htmlFor="apiKey">API Key</Label>
        <Input
          type="password"
          id="apiKey"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Glide API Key"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Your API key will be encrypted before storage
        </p>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

/**
 * ConnectionsManager component for managing Glide API connections
 */
const ConnectionsManager = () => {
  const [connections, setConnections] = useState<GlConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<GlConnection | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchConnections();
  }, []);

  /**
   * Fetches all connections from the database
   */
  const fetchConnections = async () => {
    setLoading(true);
    setError(null);
    
    try {
      logger.info('Fetching connections');
      const data = await glSyncService.getConnections();
      setConnections(data);
    } catch (error) {
      logger.error('Error fetching connections', error);
      setError('Failed to load connections');
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load connections',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles adding a new connection
   */
  const handleAddConnection = async (formData: Partial<GlConnection>) => {
    try {
      logger.info('Adding new connection');
      const newConnection = await glSyncService.createConnection({
        app_id: formData.app_id!,
        api_key: formData.api_key!,
        app_name: formData.app_name || `Glide App (${new Date().toLocaleDateString()})`,
      });
      
      setConnections(prev => [newConnection, ...prev]);
      setShowAddDialog(false);
      
      toast({
        title: 'Connection Added',
        description: 'The connection has been successfully added.',
      });
    } catch (error) {
      logger.error('Error adding connection', error);
      throw error;
    }
  };

  /**
   * Handles editing an existing connection
   */
  const handleEditConnection = async (formData: Partial<GlConnection>) => {
    if (!formData.id) return;
    
    try {
      logger.info('Updating connection', { id: formData.id });
      const updatedConnection = await glSyncService.updateConnection(
        formData.id,
        {
          app_id: formData.app_id!,
          api_key: formData.api_key!,
          app_name: formData.app_name || `Glide App (${new Date().toLocaleDateString()})`,
        }
      );
      
      if (!updatedConnection) {
        throw new Error('Failed to update connection');
      }
      
      setConnections(prev => 
        prev.map(conn => conn.id === updatedConnection.id ? updatedConnection : conn)
      );
      setShowEditDialog(false);
      
      toast({
        title: 'Connection Updated',
        description: 'The connection has been successfully updated.',
      });
    } catch (error) {
      logger.error('Error updating connection', error);
      throw error;
    }
  };

  /**
   * Handles deleting a connection
   */
  const handleDeleteConnection = async (id: string) => {
    try {
      logger.info('Deleting connection', { id });
      await glSyncService.deleteConnection(id);
      
      setConnections(prev => prev.filter(conn => conn.id !== id));
      
      toast({
        title: 'Connection Deleted',
        description: 'The connection has been successfully deleted.',
      });
    } catch (error) {
      logger.error('Error deleting connection', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete connection',
        variant: 'destructive',
      });
    }
  };

  /**
   * Tests a connection to verify it works
   */
  const testConnection = async (id: string) => {
    setTestingId(id);
    setTestResults(prev => ({ ...prev, [id]: undefined }));
    
    try {
      logger.info('Testing connection', { id });
      const success = await glSyncService.testConnection(id);
      
      setTestResults(prev => ({ ...prev, [id]: success }));
      
      toast({
        title: success ? 'Connection Successful' : 'Connection Failed',
        description: success ? 'Connection verified successfully.' : 'Failed to connect to Glide.',
        variant: success ? 'default' : 'destructive',
      });
    } catch (error) {
      logger.error('Error testing connection', error);
      setTestResults(prev => ({ ...prev, [id]: false }));
      
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to test connection',
        variant: 'destructive',
      });
    } finally {
      setTestingId(null);
    }
  };

  /**
   * Renders a connection card
   */
  const renderConnectionCard = (connection: GlConnection) => {
    const lastTestedStatus = testResults[connection.id];
    
    return (
      <Card key={connection.id} className="mb-4 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-semibold">
                {connection.app_name || 'Unnamed Connection'}
              </CardTitle>
              <CardDescription>
                Created {new Date(connection.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge variant={connection.status === 'active' ? 'default' : 'outline'}>
              {connection.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">App ID:</span>
              <span className="font-mono truncate">{connection.app_id}</span>
              
              <span className="text-muted-foreground">API Key:</span>
              <span className="font-mono">••••••••{connection.api_key.slice(-4)}</span>
            </div>
            {lastTestedStatus !== undefined && (
              <div className="mt-2 flex items-center">
                {lastTestedStatus ? (
                  <div className="text-green-500 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Connection verified
                  </div>
                ) : (
                  <div className="text-red-500 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    Connection failed
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t p-4 bg-muted/10">
          <div className="flex justify-end space-x-2 w-full">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => testConnection(connection.id)}
              disabled={testingId === connection.id}
            >
              {testingId === connection.id ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedConnection(connection);
                setShowEditDialog(true);
              }}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Connection</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this connection? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteConnection(connection.id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardFooter>
      </Card>
    );
  };

  return (
    <SyncContainer>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Connections</h2>
          <p className="text-muted-foreground">
            Configure and manage your Glide API connections
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchConnections}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Connection
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add New Connection</DialogTitle>
                <DialogDescription>
                  Enter your Glide API credentials to create a new connection.
                </DialogDescription>
              </DialogHeader>
              <ConnectionForm onSubmit={handleAddConnection} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="mb-4">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32 mt-1" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
              <CardFooter className="border-t p-4">
                <div className="flex justify-end space-x-2 w-full">
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <h3 className="text-lg font-semibold text-destructive">Error Loading Connections</h3>
            </div>
            <p className="text-muted-foreground">{error}</p>
            <Button 
              onClick={fetchConnections} 
              variant="outline" 
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : connections.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">No Connections Found</h3>
            <p className="text-muted-foreground mb-4">
              You haven't added any Glide API connections yet. Add a connection to get started.
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {connections.map(renderConnectionCard)}
        </div>
      )}
      
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Connection</DialogTitle>
            <DialogDescription>
              Update your Glide API connection details.
            </DialogDescription>
          </DialogHeader>
          
          {selectedConnection && (
            <ConnectionForm 
              initialData={selectedConnection}
              onSubmit={handleEditConnection}
            />
          )}
        </DialogContent>
      </Dialog>
    </SyncContainer>
  );
};

export default ConnectionsManager;
