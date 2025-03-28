import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GlConnection } from '@/types/glsync';
import { glSyncApi } from '@/services/glSyncApi';
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

interface ConnectionFormProps {
  onSubmit: (data: Partial<GlConnection>) => void;
  initialData?: Partial<GlConnection>;
}

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

const ConnectionsManager = () => {
  const [connections, setConnections] = useState<GlConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConnection, setSelectedConnection] = useState<GlConnection | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const data = await glSyncApi.getConnections();
      setConnections(data);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch connections',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddConnection = async (formData: Partial<GlConnection>) => {
    try {
      const newConnection = await glSyncApi.createConnection(formData);
      if (newConnection) {
        toast({
          title: 'Success',
          description: 'Connection added successfully',
        });
        setShowAddDialog(false);
        fetchConnections();
      } else {
        throw new Error('Failed to create connection');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add connection',
        variant: 'destructive',
      });
    }
  };

  const handleEditConnection = async (formData: Partial<GlConnection>) => {
    if (!selectedConnection) return;
    
    try {
      const updatedConnection = await glSyncApi.updateConnection(selectedConnection.id, formData);
      if (updatedConnection) {
        toast({
          title: 'Success',
          description: 'Connection updated successfully',
        });
        setShowEditDialog(false);
        fetchConnections();
      } else {
        throw new Error('Failed to update connection');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update connection',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConnection = async (id: string) => {
    try {
      const success = await glSyncApi.deleteConnection(id);
      if (success) {
        toast({
          title: 'Success',
          description: 'Connection deleted successfully',
        });
        fetchConnections();
      } else {
        throw new Error('Failed to delete connection');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete connection',
        variant: 'destructive',
      });
    }
  };

  const testConnection = async (id: string) => {
    setTestingId(id);
    setTestResults(prev => ({ ...prev, [id]: false }));
    
    try {
      const result = await glSyncApi.testConnection(id);
      setTestResults(prev => ({ ...prev, [id]: result }));
      
      toast({
        title: result ? 'Connection Successful' : 'Connection Failed',
        description: result 
          ? 'Successfully connected to Glide API' 
          : 'Failed to connect to Glide API, please check your credentials',
        variant: result ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to test connection',
        variant: 'destructive',
      });
    } finally {
      setTestingId(null);
    }
  };

  const renderConnectionCard = (connection: GlConnection) => (
    <Card key={connection.id}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{connection.app_name || 'Unnamed App'}</CardTitle>
            <CardDescription>
              Last synced: {connection.last_sync 
                ? new Date(connection.last_sync).toLocaleString() 
                : 'Never'}
            </CardDescription>
          </div>
          <Badge variant={connection.status === 'active' ? 'default' : 'outline'}>
            {connection.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">App ID:</span>
            <span className="font-mono">{connection.app_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">API Key:</span>
            <span className="font-mono">••••••••{connection.api_key.slice(-4)}</span>
          </div>
          {testResults[connection.id] !== undefined && (
            <div className="mt-2 flex items-center">
              {testResults[connection.id] ? (
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

  return (
    <SyncContainer>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">API Connections</h2>
        <div className="flex space-x-2">
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
                  Enter your Glide API credentials to connect with your Glide app.
                </DialogDescription>
              </DialogHeader>
              
              <ConnectionForm onSubmit={handleAddConnection} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
              <CardFooter className="border-t p-4 bg-muted/10">
                <div className="flex justify-end space-x-2 w-full">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-3">
              <h3 className="text-lg font-medium">No Connections Found</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Add a connection to your Glide app to start syncing data.
              </p>
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {connections.map((connection) => (
            <Card key={connection.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{connection.app_name || 'Unnamed App'}</CardTitle>
                    <CardDescription>
                      Last synced: {connection.last_sync 
                        ? new Date(connection.last_sync).toLocaleString() 
                        : 'Never'}
                    </CardDescription>
                  </div>
                  <Badge variant={connection.status === 'active' ? 'default' : 'outline'}>
                    {connection.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">App ID:</span>
                    <span className="font-mono">{connection.app_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">API Key:</span>
                    <span className="font-mono">••••••••{connection.api_key.slice(-4)}</span>
                  </div>
                  {testResults[connection.id] !== undefined && (
                    <div className="mt-2 flex items-center">
                      {testResults[connection.id] ? (
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
          ))}
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
