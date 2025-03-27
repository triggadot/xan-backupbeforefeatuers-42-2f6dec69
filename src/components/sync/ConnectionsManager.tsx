
import { useState, useEffect } from 'react';
import { PlusCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { glSyncApi } from '@/services/glSyncApi';
import { GlConnection } from '@/types/glsync';
import ConnectionForm from './connections/ConnectionForm';
import ConnectionCard from './connections/ConnectionCard';
import DeleteConnectionDialog from './connections/DeleteConnectionDialog';
import EditConnectionDialog from './connections/EditConnectionDialog';
import AddConnectionDialog from './connections/AddConnectionDialog';
import SyncContainer from './SyncContainer';

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
  const [isAddConnectionOpen, setIsAddConnectionOpen] = useState(false);
  const [isEditConnectionOpen, setIsEditConnectionOpen] = useState(false);
  const [isDeleteConnectionOpen, setIsDeleteConnectionOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<GlConnection | null>(null);
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

  const handleConnectionChange = (field: string, value: string) => {
    if (editConnection) {
      setEditConnection({
        ...editConnection,
        [field]: value
      });
    } else {
      setNewConnection({
        ...newConnection,
        [field]: value
      });
    }
  };

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

  const handleDeleteConnection = async (connection: GlConnection) => {
    try {
      await glSyncApi.deleteConnection(connection.id);
      setConnections(connections.filter(conn => conn.id !== connection.id));
      
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

  const handleAddConnection = () => {
    setIsAddConnectionOpen(true);
  };

  const handleEditConnection = (connection: GlConnection) => {
    setSelectedConnection(connection);
    setIsEditConnectionOpen(true);
  };

  const handleConfirmDelete = (connection: GlConnection) => {
    setSelectedConnection(connection);
    setIsDeleteConnectionOpen(true);
  };

  const handleAddConnectionSuccess = () => {
    setIsAddConnectionOpen(false);
    fetchConnections();
  };

  const handleEditConnectionSuccess = () => {
    setIsEditConnectionOpen(false);
    fetchConnections();
  };

  const handleDeleteConnectionSuccess = () => {
    setIsDeleteConnectionOpen(false);
    fetchConnections();
  };

  const renderConnectionsList = () => {
    if (isLoading) {
      return (
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
      );
    }
    
    if (connections.length === 0) {
      return (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No connections found.</p>
          <p className="mt-2">
            Create a new connection to get started with syncing Glide data.
          </p>
        </Card>
      );
    }
    
    return (
      <div className="space-y-4">
        {connections.map((connection) => (
          <ConnectionCard
            key={connection.id}
            connection={connection}
            onEdit={handleEditConnection}
            onDelete={handleConfirmDelete}
            onTest={handleTestConnection}
            isTestingConnection={!!isTestingConnection[connection.id]}
          />
        ))}
      </div>
    );
  };

  return (
    <SyncContainer>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">API Connections</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchConnections}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button onClick={handleAddConnection}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Connection
          </Button>
        </div>
      </div>

      {renderConnectionsList()}
      
      <AddConnectionDialog
        open={isAddConnectionOpen}
        onOpenChange={setIsAddConnectionOpen}
        onSuccess={handleAddConnectionSuccess}
      />
      
      {selectedConnection && (
        <>
          <EditConnectionDialog
            open={isEditConnectionOpen}
            onOpenChange={setIsEditConnectionOpen}
            connection={selectedConnection}
            onSuccess={handleEditConnectionSuccess}
          />
          
          <DeleteConnectionDialog
            open={isDeleteConnectionOpen}
            onOpenChange={setIsDeleteConnectionOpen}
            connection={selectedConnection}
            onSuccess={handleDeleteConnectionSuccess}
          />
        </>
      )}
    </SyncContainer>
  );
};

export default ConnectionsManager;
