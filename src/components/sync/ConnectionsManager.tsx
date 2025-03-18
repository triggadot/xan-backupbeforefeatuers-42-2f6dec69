
import { useState, useEffect } from 'react';
import { PlusCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useConnections } from '@/hooks/useConnections';
import { supabase } from '@/integrations/supabase/client';
import ConnectionCard from './connections/ConnectionCard';
import DeleteConnectionDialog from './connections/DeleteConnectionDialog';
import EditConnectionDialog from './connections/EditConnectionDialog';
import AddConnectionDialog from './connections/AddConnectionDialog';
import { GlConnection } from '@/types/glsync';

const ConnectionsManager = () => {
  const [isAddConnectionOpen, setIsAddConnectionOpen] = useState(false);
  const [isEditConnectionOpen, setIsEditConnectionOpen] = useState(false);
  const [isDeleteConnectionOpen, setIsDeleteConnectionOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<GlConnection | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { connections, isLoading, fetchConnections } = useConnections();

  const handleTestConnection = async (id: string) => {
    setIsTestingConnection(prev => ({ ...prev, [id]: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'testConnection',
          connectionId: id,
        },
      });

      if (error) throw error;
      
      if (data.success) {
        toast({
          title: 'Connection successful',
          description: 'Successfully connected to Glide API',
        });
        fetchConnections(true);
      } else {
        toast({
          title: 'Connection failed',
          description: data.error || 'Failed to connect to Glide API',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: 'Connection test failed',
        description: error instanceof Error ? error.message : 'Unknown error',
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
    fetchConnections(true);
  };

  const handleEditConnectionSuccess = () => {
    setIsEditConnectionOpen(false);
    fetchConnections(true);
  };

  const handleDeleteConnectionSuccess = () => {
    setIsDeleteConnectionOpen(false);
    fetchConnections(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">API Connections</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => fetchConnections(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button onClick={handleAddConnection}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Connection
          </Button>
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
      )}

      {/* Dialogs */}
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
    </div>
  );
};

export default ConnectionsManager;
