
import { useState, useEffect } from 'react';
import { PlusCircle, RefreshCw, Edit, Trash2, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useToast } from '@/components/ui/use-toast';
import { glSyncApi } from '@/services/glsync';
import { GlConnection } from '@/types/glsync';

const ConnectionsManager = () => {
  const [connections, setConnections] = useState<GlConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestingConnection, setIsTestingConnection] = useState<Record<string, boolean>>({});
  const [newConnection, setNewConnection] = useState<Partial<GlConnection>>({
    app_name: '',
    app_id: '',
    api_key: '',
  });
  const [editConnection, setEditConnection] = useState<GlConnection | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const data = await glSyncApi.getConnections();
      setConnections(data);
    } catch (error) {
      toast({
        title: 'Error fetching connections',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleCreateConnection = async () => {
    try {
      if (!newConnection.app_id || !newConnection.api_key) {
        toast({
          title: 'Validation error',
          description: 'App ID and API Key are required.',
          variant: 'destructive',
        });
        return;
      }

      const connection = await glSyncApi.addConnection(newConnection as Omit<GlConnection, 'id' | 'created_at'>);
      setConnections([...connections, connection]);
      setNewConnection({ app_name: '', app_id: '', api_key: '' });
      setIsDialogOpen(false);
      
      toast({
        title: 'Connection created',
        description: 'The Glide API connection has been created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error creating connection',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateConnection = async () => {
    try {
      if (!editConnection || !editConnection.id) return;
      
      const { id, ...connectionData } = editConnection;
      const updated = await glSyncApi.updateConnection(id, connectionData);
      
      setConnections(connections.map(conn => conn.id === id ? updated : conn));
      setEditConnection(null);
      setIsDialogOpen(false);
      
      toast({
        title: 'Connection updated',
        description: 'The Glide API connection has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error updating connection',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConnection = async (id: string) => {
    try {
      await glSyncApi.deleteConnection(id);
      setConnections(connections.filter(conn => conn.id !== id));
      
      toast({
        title: 'Connection deleted',
        description: 'The Glide API connection has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error deleting connection',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleTestConnection = async (id: string) => {
    setIsTestingConnection(prev => ({ ...prev, [id]: true }));
    
    try {
      const result = await glSyncApi.testConnection(id);
      
      if (result.success) {
        toast({
          title: 'Connection successful',
          description: 'The connection to Glide API was successful.',
        });
      } else {
        toast({
          title: 'Connection failed',
          description: result.error || 'Failed to connect to Glide API',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Connection test failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsTestingConnection(prev => ({ ...prev, [id]: false }));
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">API Connections</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchConnections}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditConnection(null);
                setNewConnection({ app_name: '', app_id: '', api_key: '' });
              }}>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Connection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editConnection ? 'Edit Connection' : 'Create New Connection'}
                </DialogTitle>
                <DialogDescription>
                  Enter your Glide API details to connect to your Glide app.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="app_name">App Name</Label>
                  <Input
                    id="app_name"
                    placeholder="My Glide App"
                    value={editConnection?.app_name || newConnection.app_name || ''}
                    onChange={(e) => {
                      if (editConnection) {
                        setEditConnection({
                          ...editConnection,
                          app_name: e.target.value
                        });
                      } else {
                        setNewConnection({
                          ...newConnection,
                          app_name: e.target.value
                        });
                      }
                    }}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="app_id">App ID <span className="text-red-500">*</span></Label>
                  <Input
                    id="app_id"
                    placeholder="YOUR_APP_ID"
                    value={editConnection?.app_id || newConnection.app_id || ''}
                    onChange={(e) => {
                      if (editConnection) {
                        setEditConnection({
                          ...editConnection,
                          app_id: e.target.value
                        });
                      } else {
                        setNewConnection({
                          ...newConnection,
                          app_id: e.target.value
                        });
                      }
                    }}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    You can find the App ID in your Glide app URL or settings.
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="api_key">API Key <span className="text-red-500">*</span></Label>
                  <Input
                    id="api_key"
                    type="password"
                    placeholder="YOUR_API_KEY"
                    value={editConnection?.api_key || newConnection.api_key || ''}
                    onChange={(e) => {
                      if (editConnection) {
                        setEditConnection({
                          ...editConnection,
                          api_key: e.target.value
                        });
                      } else {
                        setNewConnection({
                          ...newConnection,
                          api_key: e.target.value
                        });
                      }
                    }}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Access your token via the Data Editor by clicking "Show API" at the bottom of any Glide Table.
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editConnection ? handleUpdateConnection : handleCreateConnection}>
                  {editConnection ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="flex justify-end space-x-2">
                <div className="h-9 bg-gray-200 rounded w-24"></div>
                <div className="h-9 bg-gray-200 rounded w-24"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : connections.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No connections found.</p>
          <p className="mt-2">
            Create a new connection to get started with syncing Glide data.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => (
            <Card key={connection.id} className="p-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h3 className="text-lg font-medium">
                    {connection.app_name || 'Unnamed App'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    App ID: {connection.app_id}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Last Synced: {formatDate(connection.last_sync)}
                  </p>
                </div>
                
                <div className="flex space-x-2 mt-4 md:mt-0">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleTestConnection(connection.id)}
                    disabled={isTestingConnection[connection.id]}
                  >
                    {isTestingConnection[connection.id] ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                  
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setEditConnection(connection)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Connection</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this connection? This will also delete all associated mappings and sync configurations.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteConnection(connection.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConnectionsManager;
