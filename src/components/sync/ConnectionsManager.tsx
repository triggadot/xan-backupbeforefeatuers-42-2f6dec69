import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { GlConnection } from '@/types/glsync';
import { supabase } from '@/integrations/supabase/client';

interface ConnectionTestResult {
  status: 'success' | 'error' | 'unknown';
  message?: string;
}

interface ConnectionCardProps {
  connection: GlConnection;
  testResult: ConnectionTestResult;
  onTest: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isTestingConnection: boolean;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({ connection, testResult, onTest, onEdit, onDelete, isTestingConnection }) => {
  let statusIcon;
  let statusColor = 'text-gray-500';

  if (testResult.status === 'success') {
    statusIcon = <CheckCircle className="h-4 w-4 text-green-500 mr-2" />;
    statusColor = 'text-green-500';
  } else if (testResult.status === 'error') {
    statusIcon = <AlertCircle className="h-4 w-4 text-red-500 mr-2" />;
    statusColor = 'text-red-500';
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>{connection.app_name || 'Unnamed App'}</CardTitle>
        <CardDescription>
          Connection ID: {connection.id}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center">
          {statusIcon}
          <span className={statusColor}>
            {testResult.status === 'success' ? 'Connection Successful' : testResult.status === 'error' ? 'Connection Failed' : 'Connection Status Unknown'}
          </span>
        </div>
        {testResult.message && <p className="text-sm text-muted-foreground">{testResult.message}</p>}
        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={onTest} disabled={isTestingConnection}>
            {isTestingConnection ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
          <Button variant="secondary" size="sm" onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface AddConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (connection: Omit<GlConnection, "id" | "created_at">) => Promise<void>;
  onSuccess: () => void;
}

const AddConnectionDialog: React.FC<AddConnectionDialogProps> = ({ open, onOpenChange, onSubmit, onSuccess }) => {
  const [appName, setAppName] = useState('');
  const [appId, setAppId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appName || !appId || !apiKey) {
      toast({
        title: 'Error',
        description: 'All fields are required.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        app_name: appName,
        app_id: appId,
        api_key: apiKey,
      });
      toast({
        title: 'Success',
        description: 'Connection added successfully.',
      });
      onSuccess();
    } catch (error) {
      console.error('Error adding connection:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add connection.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Connection
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Connection</DialogTitle>
          <DialogDescription>
            Add a new Glide connection to sync data.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="appName" className="text-right">
              App Name
            </Label>
            <Input id="appName" value={appName} onChange={(e) => setAppName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="appId" className="text-right">
              App ID
            </Label>
            <Input id="appId" value={appId} onChange={(e) => setAppId(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiKey" className="text-right">
              API Key
            </Label>
            <Input id="apiKey" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="col-span-3" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Connection'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface EditConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: GlConnection;
  onSubmit: (updates: Partial<GlConnection>) => Promise<void>;
  onSuccess: () => void;
}

const EditConnectionDialog: React.FC<EditConnectionDialogProps> = ({ open, onOpenChange, connection, onSubmit, onSuccess }) => {
  const [appName, setAppName] = useState(connection.app_name || '');
  const [appId, setAppId] = useState(connection.app_id);
  const [apiKey, setApiKey] = useState(connection.api_key);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appName || !appId || !apiKey) {
      toast({
        title: 'Error',
        description: 'All fields are required.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: connection.id,
        app_name: appName,
        app_id: appId,
        api_key: apiKey,
      });
      toast({
        title: 'Success',
        description: 'Connection updated successfully.',
      });
      onSuccess();
    } catch (error) {
      console.error('Error updating connection:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update connection.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Connection</DialogTitle>
          <DialogDescription>
            Edit the details of the selected Glide connection.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="appName" className="text-right">
              App Name
            </Label>
            <Input id="appName" value={appName} onChange={(e) => setAppName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="appId" className="text-right">
              App ID
            </Label>
            <Input id="appId" value={appId} onChange={(e) => setAppId(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiKey" className="text-right">
              API Key
            </Label>
            <Input id="apiKey" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="col-span-3" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Connection'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface DeleteConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: GlConnection;
  onDelete: () => Promise<void>;
  onSuccess: () => void;
}

const DeleteConnectionDialog: React.FC<DeleteConnectionDialogProps> = ({ open, onOpenChange, connection, onDelete, onSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      toast({
        title: 'Success',
        description: 'Connection deleted successfully.',
      });
      onSuccess();
    } catch (error) {
      console.error('Error deleting connection:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete connection.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Connection</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this connection? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isDeleting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={isDeleting} onClick={handleDelete}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Connection'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export function ConnectionsManager() {
  const [connections, setConnections] = useState<GlConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<GlConnection | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, ConnectionTestResult>>({});
  const [isTestingConnection, setIsTestingConnection] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchConnections = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch connections.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const addConnection = async (connection: Omit<GlConnection, "id" | "created_at">) => {
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .insert([connection])
        .select()

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setConnections(prev => [...prev, data[0]]);
        toast({
          title: 'Success',
          description: 'Connection added successfully.',
        });
      }
    } catch (error) {
      console.error('Error adding connection:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add connection.',
        variant: 'destructive',
      });
    }
  };

  const updateConnection = async (id: string, updates: Partial<GlConnection>) => {
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setConnections(prev => prev.map(conn => (conn.id === id ? { ...conn, ...data[0] } : conn)));
        toast({
          title: 'Success',
          description: 'Connection updated successfully.',
        });
      }
    } catch (error) {
      console.error('Error updating connection:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update connection.',
        variant: 'destructive',
      });
    }
  };

  const deleteConnection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gl_connections')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setConnections(prev => prev.filter(conn => conn.id !== id));
      toast({
        title: 'Success',
        description: 'Connection deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting connection:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete connection.',
        variant: 'destructive',
      });
    }
  };

  const testConnection = async (connectionId: string) => {
    setIsTestingConnection(prev => ({ ...prev, [connectionId]: true }));
    try {
      const { data, error } = await supabase.functions.invoke('test-glide-connection', {
        body: { connection_id: connectionId },
      });

      if (error) {
        console.error('Function error:', error);
        setTestResults(prev => ({
          ...prev,
          [connectionId]: { status: 'error', message: error.message },
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          [connectionId]: { status: 'success', message: data.message },
        }));
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResults(prev => ({
        ...prev,
        [connectionId]: { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' },
      }));
    } finally {
      setIsTestingConnection(prev => ({ ...prev, [connectionId]: false }));
    }
  };

  const handleAddClick = () => {
    setShowAddDialog(true);
  };

  const handleEditClick = (connection: GlConnection) => {
    setSelectedConnection(connection);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (connection: GlConnection) => {
    setSelectedConnection(connection);
    setShowDeleteDialog(true);
  };

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Convert the return values of handlers to void
  const handleAddConnection = async (connection: Omit<GlConnection, "id" | "created_at">): Promise<void> => {
    const result = await addConnection(connection);
    // Return void instead of the result
    return Promise.resolve();
  };

  const handleUpdateConnection = async (updates: Partial<GlConnection>): Promise<void> => {
    const result = await updateConnection(selectedConnection!.id, updates);
    // Return void instead of the result
    return Promise.resolve();
  };

  const handleDeleteConnection = async (): Promise<void> => {
    const result = await deleteConnection(selectedConnection!.id);
    // Return void instead of the result
    return Promise.resolve();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Connections</h2>
        <Button variant="outline" onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          Add Connection
        </Button>
      </div>
      
      {connections.map((connection) => (
        <ConnectionCard
          key={connection.id}
          connection={connection}
          testResult={testResults[connection.id] || { status: 'unknown' }}
          onTest={() => testConnection(connection.id)}
          onEdit={() => handleEditClick(connection)}
          onDelete={() => handleDeleteClick(connection)}
          isTestingConnection={isTestingConnection[connection.id] || false}
        />
      ))}
      
      <AddConnectionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={handleAddConnection}
        onSuccess={() => {
          fetchConnections();
          setShowAddDialog(false);
        }}
      />
      
      {selectedConnection && (
        <EditConnectionDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          connection={selectedConnection}
          onSubmit={handleUpdateConnection}
          onSuccess={() => {
            fetchConnections();
            setShowEditDialog(false);
          }}
        />
      )}
      
      {selectedConnection && (
        <DeleteConnectionDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          connection={selectedConnection}
          onDelete={handleDeleteConnection}
          onSuccess={() => {
            fetchConnections();
            setShowDeleteDialog(false);
          }}
        />
      )}
    </div>
  );
}
