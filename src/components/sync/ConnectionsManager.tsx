
import React, { useState } from 'react';
import { useConnections } from '@/hooks/useConnections';
import { Card } from '@/components/ui/card';
import { ConnectionCard } from './connections/ConnectionCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddConnectionDialog } from './connections/AddConnectionDialog';
import { EditConnectionDialog } from './connections/EditConnectionDialog';
import { DeleteConnectionDialog } from './connections/DeleteConnectionDialog';
import { GlConnection } from '@/types/glsync';

export interface ConnectionsManagerProps {
  onConnectionSelect?: (connectionId: string) => void;
  selectedConnectionId?: string;
}

export const ConnectionsManager: React.FC<ConnectionsManagerProps> = ({
  onConnectionSelect,
  selectedConnectionId,
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<GlConnection | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: string; message?: string }>>({});
  const [isTestingConnection, setIsTestingConnection] = useState<Record<string, boolean>>({});

  const {
    connections,
    isLoading,
    error,
    addConnection,
    updateConnection,
    deleteConnection,
    testConnection,
  } = useConnections();

  const handleEdit = (connection: GlConnection) => {
    setSelectedConnection(connection);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (connection: GlConnection) => {
    setSelectedConnection(connection);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitEdit = async (updates: Partial<GlConnection>) => {
    if (!selectedConnection) return;
    try {
      await updateConnection(selectedConnection.id, updates);
      setIsEditDialogOpen(false);
      setSelectedConnection(null);
      return true;
    } catch (error) {
      console.error('Failed to update connection:', error);
      return false;
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedConnection) return;
    try {
      await deleteConnection(selectedConnection.id);
      setIsDeleteDialogOpen(false);
      setSelectedConnection(null);
      return true;
    } catch (error) {
      console.error('Failed to delete connection:', error);
      return false;
    }
  };

  const handleSubmitAdd = async (connection: Omit<GlConnection, 'id' | 'created_at'>) => {
    try {
      await addConnection(connection);
      setIsAddDialogOpen(false);
      return true;
    } catch (error) {
      console.error('Failed to add connection:', error);
      return false;
    }
  };

  const handleTest = async (connection: GlConnection) => {
    try {
      setIsTestingConnection({ ...isTestingConnection, [connection.id]: true });
      const result = await testConnection(connection);
      setTestResults({
        ...testResults,
        [connection.id]: result,
      });
      setIsTestingConnection({ ...isTestingConnection, [connection.id]: false });
    } catch (error) {
      setTestResults({
        ...testResults,
        [connection.id]: {
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      setIsTestingConnection({ ...isTestingConnection, [connection.id]: false });
    }
  };

  const handleConnectionSuccess = () => {
    // Refresh connections or handle any post-success actions
  };

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        <p>Error loading connections: {error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Connections</h1>
        <Button onClick={() => setIsAddDialogOpen(true)} variant="default">
          <Plus className="mr-2 h-4 w-4" />
          Add Connection
        </Button>
      </div>

      {connections.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No connections found</p>
          <Button onClick={() => setIsAddDialogOpen(true)} variant="default">
            <Plus className="mr-2 h-4 w-4" />
            Add your first connection
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {connections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              testResult={testResults[connection.id] || { status: '' }}
              onTest={() => handleTest(connection)}
              onEdit={() => handleEdit(connection)}
              onDelete={() => handleDelete(connection)}
              isTestingConnection={isTestingConnection[connection.id] || false}
              onSuccess={handleConnectionSuccess}
            />
          ))}
        </div>
      )}

      <AddConnectionDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleSubmitAdd}
        onSuccess={handleConnectionSuccess}
      />

      {selectedConnection && (
        <>
          <EditConnectionDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            connection={selectedConnection}
            onSubmit={handleSubmitEdit}
            onSuccess={handleConnectionSuccess}
          />

          <DeleteConnectionDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            connection={selectedConnection}
            onDelete={handleSubmitDelete}
            onSuccess={handleConnectionSuccess}
          />
        </>
      )}
    </div>
  );
};
