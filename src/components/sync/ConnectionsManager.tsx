
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Loader2 } from 'lucide-react';
import ConnectionCard from './connections/ConnectionCard';
import AddConnectionDialog from './connections/AddConnectionDialog';
import EditConnectionDialog from './connections/EditConnectionDialog';
import DeleteConnectionDialog from './connections/DeleteConnectionDialog';
import { GlConnection } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';
import { glSyncApi } from '@/services/glsync';

export const ConnectionsManager: React.FC = () => {
  const [connections, setConnections] = useState<GlConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<GlConnection | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: string; message?: string }>>({});
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { toast } = useToast();

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const { success, connections, error } = await glSyncApi.listConnections();
      
      if (success) {
        setConnections(connections);
      } else {
        toast({
          title: 'Error loading connections',
          description: error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load connections',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleTestConnection = async (connectionId: string) => {
    setTestResults(prev => ({
      ...prev,
      [connectionId]: { status: 'testing' }
    }));
    setIsTestingConnection(true);

    try {
      const { success, result, error } = await glSyncApi.testConnection(connectionId);
      
      if (success) {
        setTestResults(prev => ({
          ...prev,
          [connectionId]: { status: 'success', message: 'Connection successful' }
        }));
        
        toast({
          title: 'Connection Test Successful',
          description: 'Successfully connected to Glide API',
        });
      } else {
        setTestResults(prev => ({
          ...prev,
          [connectionId]: { status: 'error', message: error }
        }));
        
        toast({
          title: 'Connection Test Failed',
          description: error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      
      setTestResults(prev => ({
        ...prev,
        [connectionId]: { status: 'error', message: 'Unknown error occurred' }
      }));
      
      toast({
        title: 'Connection Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleAddConnection = async (connection: Omit<GlConnection, 'id' | 'created_at'>) => {
    try {
      const result = await glSyncApi.createConnection(connection);
      
      if (result.success) {
        toast({
          title: 'Connection Added',
          description: 'Successfully added new connection',
        });
        
        // Add the new connection to the state
        setConnections(prev => [...prev, result.connection]);
        setIsAddOpen(false);
        return true;
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error adding connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to add connection',
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleUpdateConnection = async (id: string, updates: Partial<GlConnection>) => {
    try {
      const result = await glSyncApi.updateConnection(id, updates);
      
      if (result.success) {
        toast({
          title: 'Connection Updated',
          description: 'Successfully updated connection',
        });
        
        // Update the connection in the state
        setConnections(prev => 
          prev.map(conn => conn.id === id ? result.connection : conn)
        );
        setIsEditOpen(false);
        setSelectedConnection(null);
        return true;
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error updating connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to update connection',
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleDeleteConnection = async (id: string) => {
    try {
      const result = await glSyncApi.deleteConnection(id);
      
      if (result.success) {
        toast({
          title: 'Connection Deleted',
          description: 'Successfully deleted connection',
        });
        
        // Remove the connection from the state
        setConnections(prev => prev.filter(conn => conn.id !== id));
        setIsDeleteOpen(false);
        setSelectedConnection(null);
        return true;
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete connection',
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleAddSuccess = () => {
    fetchConnections();
  };

  const handleEditSuccess = () => {
    fetchConnections();
  };

  const handleDeleteSuccess = () => {
    fetchConnections();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Connections</h2>
        <Button onClick={() => setIsAddOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Connection
        </Button>
      </div>
      
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      ) : connections.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col justify-center items-center h-40 space-y-4">
              <p className="text-muted-foreground">No connections found.</p>
              <Button onClick={() => setIsAddOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Your First Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {connections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              testResult={testResults[connection.id]}
              isTestingConnection={isTestingConnection}
              onTest={() => handleTestConnection(connection.id)}
              onEdit={() => {
                setSelectedConnection(connection);
                setIsEditOpen(true);
              }}
              onDelete={() => {
                setSelectedConnection(connection);
                setIsDeleteOpen(true);
              }}
            />
          ))}
        </div>
      )}
      
      <AddConnectionDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={handleAddConnection}
        onSuccess={handleAddSuccess}
      />
      
      {selectedConnection && (
        <>
          <EditConnectionDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            connection={selectedConnection}
            onSubmit={(updates) => handleUpdateConnection(selectedConnection.id, updates)}
            onSuccess={handleEditSuccess}
          />
          
          <DeleteConnectionDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            connection={selectedConnection}
            onDelete={() => handleDeleteConnection(selectedConnection.id)}
            onSuccess={handleDeleteSuccess}
          />
        </>
      )}
    </div>
  );
};

export default ConnectionsManager;
