import React, { useState, useEffect } from 'react';
import { PlusCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { GlConnection } from '@/types/glsync';
import ConnectionCard from './ConnectionCard';
import AddConnectionDialog from './AddConnectionDialog';
import EditConnectionDialog from './EditConnectionDialog';
import DeleteConnectionDialog from './DeleteConnectionDialog';
import { useToast } from '@/hooks/use-toast';

const ConnectionsList: React.FC = () => {
  const [connections, setConnections] = useState<GlConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<GlConnection | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const transformedConnections: GlConnection[] = (data || []).map(conn => ({
        id: conn.id,
        app_id: conn.app_id,
        api_key: conn.api_key,
        app_name: conn.app_name,
        last_sync: conn.last_sync,
        created_at: conn.created_at,
        status: conn.status,
        settings: conn.settings ? 
          (typeof conn.settings === 'string' ? JSON.parse(conn.settings) : conn.settings) 
          : {}
      }));
      
      setConnections(transformedConnections);
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

  const handleEdit = (connection: GlConnection) => {
    setSelectedConnection(connection);
    setShowEditDialog(true);
  };

  const handleDelete = (connection: GlConnection) => {
    setSelectedConnection(connection);
    setShowDeleteDialog(true);
  };

  const handleTest = async (id: string) => {
    setIsTestingConnection(true);
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
        fetchConnections();
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
        title: 'Connection test error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleAddConnection = () => {
    setShowAddDialog(true);
  };

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    fetchConnections();
    toast({
      title: 'Connection added',
      description: 'New Glide connection has been added successfully',
    });
  };

  const handleEditSuccess = () => {
    setShowEditDialog(false);
    fetchConnections();
    toast({
      title: 'Connection updated',
      description: 'Glide connection has been updated successfully',
    });
  };

  const handleDeleteSuccess = () => {
    setShowDeleteDialog(false);
    fetchConnections();
    toast({
      title: 'Connection deleted',
      description: 'Glide connection has been deleted successfully',
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Glide Connections</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchConnections}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAddConnection}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Connection
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-1/3 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/4 mb-6" />
              <div className="flex justify-end">
                <Skeleton className="h-9 w-24 ml-2" />
                <Skeleton className="h-9 w-24 ml-2" />
                <Skeleton className="h-9 w-24 ml-2" />
              </div>
            </Card>
          ))}
        </div>
      ) : connections.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No connections found</p>
          <p className="mt-2">Create a connection to start syncing data</p>
          <Button className="mt-4" onClick={handleAddConnection}>
            Add Connection
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTest={handleTest}
              isTestingConnection={isTestingConnection}
            />
          ))}
        </div>
      )}

      <AddConnectionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleAddSuccess}
      />

      {selectedConnection && (
        <>
          <EditConnectionDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            connection={selectedConnection}
            onSuccess={handleEditSuccess}
          />
          
          <DeleteConnectionDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            connection={selectedConnection}
            onSuccess={handleDeleteSuccess}
          />
        </>
      )}
    </div>
  );
};

export default ConnectionsList;
