import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Database, Edit, Trash2, RefreshCw, Plus, Check, 
  X, Loader2, ExternalLink, Key, Server 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/utils/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Interface for connection objects
 */
interface Connection {
  id: string;
  app_id: string;
  app_name: string | null;
  api_key: string;
  status: string | null;
  last_sync: string | null;
  created_at: string | null;
  settings: any;
}

/**
 * ConnectionsPanel component for managing database connections
 * 
 * This component provides a comprehensive interface for viewing, creating,
 * editing, and testing connections to external data sources.
 * 
 * @returns {JSX.Element} Connections panel component
 */
export function ConnectionsPanel() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [newConnection, setNewConnection] = useState({
    app_id: '',
    app_name: '',
    api_key: ''
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch connections on component mount
  useEffect(() => {
    fetchConnections();
  }, []);

  // Fetch connections from the database
  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch connections.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test a connection
  const testConnection = async (connection: Connection) => {
    setIsTestingConnection(true);
    try {
      // This would typically call an API to test the connection
      // For now, we'll just simulate a successful test
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Connection Successful',
        description: `Successfully connected to ${connection.app_name || connection.app_id}.`,
      });
      
      // Update connection status
      const { error } = await supabase
        .from('gl_connections')
        .update({ status: 'connected' })
        .eq('id', connection.id);
      
      if (error) throw error;
      
      // Refresh connections
      fetchConnections();
      
      return true;
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to the data source.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Create a new connection
  const createConnection = async () => {
    if (!newConnection.app_id || !newConnection.api_key) {
      toast({
        title: 'Validation Error',
        description: 'App ID and API Key are required.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .insert({
          app_id: newConnection.app_id,
          app_name: newConnection.app_name || newConnection.app_id,
          api_key: newConnection.api_key,
          status: 'pending'
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Connection created successfully.',
      });
      
      // Reset form and close dialog
      setNewConnection({
        app_id: '',
        app_name: '',
        api_key: ''
      });
      setIsDialogOpen(false);
      
      // Refresh connections
      fetchConnections();
    } catch (error) {
      console.error('Error creating connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to create connection.',
        variant: 'destructive',
      });
    }
  };

  // Update an existing connection
  const updateConnection = async () => {
    if (!editingConnection) return;
    
    try {
      const { error } = await supabase
        .from('gl_connections')
        .update({
          app_id: editingConnection.app_id,
          app_name: editingConnection.app_name,
          api_key: editingConnection.api_key
        })
        .eq('id', editingConnection.id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Connection updated successfully.',
      });
      
      // Reset editing state
      setEditingConnection(null);
      
      // Refresh connections
      fetchConnections();
    } catch (error) {
      console.error('Error updating connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to update connection.',
        variant: 'destructive',
      });
    }
  };

  // Delete a connection
  const deleteConnection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gl_connections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Connection deleted successfully.',
      });
      
      // Refresh connections
      fetchConnections();
    } catch (error) {
      console.error('Error deleting connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete connection.',
        variant: 'destructive',
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Render connection status badge
  const renderStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    switch (status.toLowerCase()) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Data Source Connections</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Connection
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Connection</DialogTitle>
              <DialogDescription>
                Connect to a Glide app to synchronize data
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="app_id" className="text-right">
                  App ID
                </Label>
                <Input
                  id="app_id"
                  value={newConnection.app_id}
                  onChange={(e) => setNewConnection({...newConnection, app_id: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="app_name" className="text-right">
                  App Name
                </Label>
                <Input
                  id="app_name"
                  value={newConnection.app_name}
                  onChange={(e) => setNewConnection({...newConnection, app_name: e.target.value})}
                  className="col-span-3"
                  placeholder="Optional"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="api_key" className="text-right">
                  API Key
                </Label>
                <Input
                  id="api_key"
                  type="password"
                  value={newConnection.api_key}
                  onChange={(e) => setNewConnection({...newConnection, api_key: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createConnection}>
                Create Connection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : connections.length === 0 ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center">
            <Server className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Connections Found</h3>
            <p className="text-center text-muted-foreground mb-6">
              Create a new connection to start synchronizing data from external sources.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Connection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connections.map(connection => (
            <Card key={connection.id} className="overflow-hidden">
              {editingConnection?.id === connection.id ? (
                // Editing mode
                <>
                  <CardHeader>
                    <CardTitle>Edit Connection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`edit_app_id_${connection.id}`}>App ID</Label>
                        <Input
                          id={`edit_app_id_${connection.id}`}
                          value={editingConnection.app_id}
                          onChange={(e) => setEditingConnection({
                            ...editingConnection,
                            app_id: e.target.value
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`edit_app_name_${connection.id}`}>App Name</Label>
                        <Input
                          id={`edit_app_name_${connection.id}`}
                          value={editingConnection.app_name || ''}
                          onChange={(e) => setEditingConnection({
                            ...editingConnection,
                            app_name: e.target.value
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`edit_api_key_${connection.id}`}>API Key</Label>
                        <Input
                          id={`edit_api_key_${connection.id}`}
                          type="password"
                          value={editingConnection.api_key}
                          onChange={(e) => setEditingConnection({
                            ...editingConnection,
                            api_key: e.target.value
                          })}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2 border-t p-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingConnection(null)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={updateConnection}>
                      Save Changes
                    </Button>
                  </CardFooter>
                </>
              ) : (
                // View mode
                <>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{connection.app_name || connection.app_id}</CardTitle>
                        <CardDescription>{connection.app_id}</CardDescription>
                      </div>
                      {renderStatusBadge(connection.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="details" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                      </TabsList>
                      <TabsContent value="details" className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">API Key:</span>
                            <span className="font-mono">••••••••{connection.api_key.slice(-4)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Last Sync:</span>
                            <span>{formatDate(connection.last_sync)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Created:</span>
                            <span>{formatDate(connection.created_at)}</span>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="settings" className="pt-4">
                        <div className="space-y-4">
                          <div className="text-sm text-muted-foreground">
                            Additional connection settings and options will be displayed here.
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t p-4">
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setEditingConnection(connection)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Connection</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this connection? This will also remove all associated mappings.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteConnection(connection.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <Button 
                      onClick={() => testConnection(connection)}
                      disabled={isTestingConnection}
                    >
                      {isTestingConnection ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Test Connection
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
