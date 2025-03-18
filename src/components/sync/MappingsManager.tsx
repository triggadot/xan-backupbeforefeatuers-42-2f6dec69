
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { glSyncApi } from '@/services/glsync';
import { GlConnection, GlMapping, GlideTable } from '@/types/glsync';
import { supabase } from '@/integrations/supabase/client';
import MappingCard from './mappings/MappingCard';
import DeleteMappingDialog from './mappings/DeleteMappingDialog';
import MappingForm from './mappings/MappingForm';

const MappingsManager = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<GlConnection[]>([]);
  const [mappings, setMappings] = useState<GlMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [glideTables, setGlideTables] = useState<GlideTable[]>([]);
  const [supabaseTables, setSupabaseTables] = useState<string[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableGlideColumns, setAvailableGlideColumns] = useState<Array<{ id: string; name: string; type?: string }>>([]);
  const [activeTab, setActiveTab] = useState('general');
  const [newMapping, setNewMapping] = useState<Partial<GlMapping>>({
    connection_id: '',
    glide_table: '',
    glide_table_display_name: '',
    supabase_table: '',
    column_mappings: {},
    sync_direction: 'to_supabase',
    enabled: true,
  });
  const [editMapping, setEditMapping] = useState<GlMapping | null>(null);
  const [customGlideTables, setCustomGlideTables] = useState<GlideTable[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const connectionsData = await glSyncApi.getConnections();
      setConnections(connectionsData);
      
      const mappingsData = await glSyncApi.getMappings();
      setMappings(mappingsData);
    } catch (error) {
      toast({
        title: 'Error fetching data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSupabaseTables();
  }, []);

  const fetchSupabaseTables = async () => {
    try {
      const { data, error } = await supabase
        .from('gl_tables_view')
        .select('table_name');
      
      if (error) throw new Error(error.message);
      
      const tables = data?.map(item => item.table_name)
        .filter(name => name && name.startsWith('gl_')) || [];
      
      setSupabaseTables(tables);
    } catch (error) {
      console.error('Error fetching Supabase tables:', error);
      setSupabaseTables(['gl_accounts', 'gl_products', 'gl_invoices', 'gl_estimates']);
    }
  };

  const fetchGlideTables = async (connectionId: string) => {
    setIsLoadingTables(true);
    try {
      const result = await glSyncApi.listGlideTables(connectionId);
      
      if ('tables' in result) {
        const allTables = [...result.tables];
        
        // Add custom tables from existing mappings
        const mappingsForConnection = mappings.filter(m => m.connection_id === connectionId);
        mappingsForConnection.forEach(mapping => {
          const exists = allTables.some(table => table.id === mapping.glide_table);
          if (!exists) {
            allTables.push({
              id: mapping.glide_table,
              display_name: mapping.glide_table_display_name || mapping.glide_table
            });
          }
        });
        
        setGlideTables(allTables);
      } else {
        toast({
          title: 'Error fetching Glide tables',
          description: result.error,
          variant: 'destructive',
        });
        setGlideTables([]);
      }
    } catch (error) {
      toast({
        title: 'Error fetching Glide tables',
        description: error.message,
        variant: 'destructive',
      });
      setGlideTables([]);
    } finally {
      setIsLoadingTables(false);
    }
  };

  const handleConnectionChange = (connectionId: string) => {
    setSelectedConnection(connectionId);
    
    if (editMapping) {
      setEditMapping({
        ...editMapping,
        connection_id: connectionId,
      });
    } else {
      setNewMapping({
        ...newMapping,
        connection_id: connectionId,
      });
    }
    
    fetchGlideTables(connectionId);
  };

  const handleAddGlideTable = (newTable: GlideTable) => {
    setGlideTables(prev => [...prev, newTable]);
    setCustomGlideTables(prev => [...prev, newTable]);
  };

  const handleGlideTableChange = async (tableId: string, displayName: string) => {
    if (editMapping) {
      setEditMapping({
        ...editMapping,
        glide_table: tableId,
        glide_table_display_name: displayName,
      });
    } else {
      setNewMapping({
        ...newMapping,
        glide_table: tableId,
        glide_table_display_name: displayName,
      });
    }

    // Fetch columns if table is selected
    if (tableId && selectedConnection) {
      try {
        const result = await glSyncApi.getGlideTableColumns(selectedConnection, tableId);
        if ('columns' in result) {
          setAvailableGlideColumns(result.columns.map(col => ({
            id: col.id,
            name: col.name,
            type: col.type
          })));
          
          // Create initial column mappings
          const initialColumnMappings: Record<string, any> = {};
          result.columns.forEach(column => {
            initialColumnMappings[column.id] = {
              glide_column_name: column.name,
              supabase_column_name: column.name.toLowerCase().replace(/\s+/g, '_'),
              data_type: typeof column.type === 'string' ? 
                (column.type as 'string' | 'number' | 'boolean' | 'date-time' | 'image-uri' | 'email-address') : 
                'string'
            };
          });
          
          if (editMapping) {
            // For edit, only add new mappings
            setEditMapping({
              ...editMapping,
              column_mappings: {
                ...initialColumnMappings,
                ...editMapping.column_mappings
              },
            });
          } else {
            setNewMapping({
              ...newMapping,
              column_mappings: initialColumnMappings,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching column data:', error);
      }
    }
  };

  const handleSupabaseTableChange = (value: string) => {
    if (editMapping) {
      setEditMapping({
        ...editMapping,
        supabase_table: value,
      });
    } else {
      setNewMapping({
        ...newMapping,
        supabase_table: value,
      });
    }
  };

  const handleSyncDirectionChange = (value: 'to_supabase' | 'to_glide' | 'both') => {
    if (editMapping) {
      setEditMapping({
        ...editMapping,
        sync_direction: value,
      });
    } else {
      setNewMapping({
        ...newMapping,
        sync_direction: value,
      });
    }
  };

  const handleEnabledChange = (checked: boolean) => {
    if (editMapping) {
      setEditMapping({
        ...editMapping,
        enabled: checked,
      });
    } else {
      setNewMapping({
        ...newMapping,
        enabled: checked,
      });
    }
  };

  const handleColumnMappingsChange = (updatedMapping: {column_mappings: Record<string, any>}) => {
    if (editMapping) {
      setEditMapping({
        ...editMapping,
        column_mappings: updatedMapping.column_mappings,
      });
    } else {
      setNewMapping({
        ...newMapping,
        column_mappings: updatedMapping.column_mappings,
      });
    }
  };

  const handleCreateMapping = async () => {
    try {
      if (!newMapping.connection_id || !newMapping.glide_table || !newMapping.supabase_table) {
        toast({
          title: 'Validation error',
          description: 'Connection, Glide table, and Supabase table are required.',
          variant: 'destructive',
        });
        return;
      }

      // Ensure display name
      if (!newMapping.glide_table_display_name) {
        newMapping.glide_table_display_name = newMapping.glide_table;
      }

      const mapping = await glSyncApi.addMapping(newMapping as Omit<GlMapping, 'id' | 'created_at'>);
      setMappings([...mappings, mapping]);
      setNewMapping({
        connection_id: '',
        glide_table: '',
        glide_table_display_name: '',
        supabase_table: '',
        column_mappings: {},
        sync_direction: 'to_supabase',
        enabled: true,
      });
      setIsDialogOpen(false);
      
      toast({
        title: 'Mapping created',
        description: 'The table mapping has been created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error creating mapping',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateMapping = async () => {
    try {
      if (!editMapping || !editMapping.id) return;
      
      const { id, ...mappingData } = editMapping;
      const updated = await glSyncApi.updateMapping(id, mappingData);
      
      setMappings(mappings.map(m => m.id === id ? updated : m));
      setEditMapping(null);
      setIsDialogOpen(false);
      
      toast({
        title: 'Mapping updated',
        description: 'The table mapping has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error updating mapping',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMapping = async (id: string) => {
    try {
      await glSyncApi.deleteMapping(id);
      setMappings(mappings.filter(m => m.id !== id));
      
      toast({
        title: 'Mapping deleted',
        description: 'The table mapping has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error deleting mapping',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleMapping = async (mapping: GlMapping) => {
    try {
      const updated = await glSyncApi.updateMapping(mapping.id, {
        enabled: !mapping.enabled,
      });
      
      setMappings(mappings.map(m => m.id === mapping.id ? updated : m));
      
      toast({
        title: `Mapping ${updated.enabled ? 'enabled' : 'disabled'}`,
        description: `The table mapping has been ${updated.enabled ? 'enabled' : 'disabled'} successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error updating mapping',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleGoToProductSync = (mapping: GlMapping) => {
    navigate(`/sync/products/${mapping.id}`);
  };

  const getConnectionName = (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    return connection?.app_name || 'Unnamed App';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Table Mappings</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (open) {
              setActiveTab('general');
            } else {
              setEditMapping(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditMapping(null);
                setNewMapping({
                  connection_id: '',
                  glide_table: '',
                  glide_table_display_name: '',
                  supabase_table: '',
                  column_mappings: {},
                  sync_direction: 'to_supabase',
                  enabled: true,
                });
                setSelectedConnection('');
                setAvailableGlideColumns([]);
              }}>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Mapping
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editMapping ? 'Edit Mapping' : 'Create New Mapping'}
                </DialogTitle>
                <DialogDescription>
                  Configure how tables sync between Glide and Supabase.
                </DialogDescription>
              </DialogHeader>
              
              <MappingForm
                mapping={editMapping || newMapping}
                isEditing={!!editMapping}
                connections={connections}
                glideTables={glideTables}
                supabaseTables={supabaseTables}
                isLoadingTables={isLoadingTables}
                selectedConnection={selectedConnection}
                activeTab={activeTab}
                availableGlideColumns={availableGlideColumns}
                onConnectionChange={handleConnectionChange}
                onGlideTableChange={handleGlideTableChange}
                onSupabaseTableChange={handleSupabaseTableChange}
                onSyncDirectionChange={handleSyncDirectionChange}
                onEnabledChange={handleEnabledChange}
                onColumnMappingsChange={handleColumnMappingsChange}
                onAddGlideTable={handleAddGlideTable}
                onTabChange={setActiveTab}
                onSubmit={editMapping ? handleUpdateMapping : handleCreateMapping}
                onCancel={() => setIsDialogOpen(false)}
              />
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
      ) : mappings.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No mappings found.</p>
          <p className="mt-2">
            Create a new mapping to define how tables sync between Glide and Supabase.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {mappings.map((mapping) => (
            <div key={mapping.id} className="flex items-center gap-2">
              <MappingCard
                mapping={mapping}
                connectionName={getConnectionName(mapping.connection_id)}
                onEdit={(mapping) => {
                  setEditMapping(mapping);
                  setSelectedConnection(mapping.connection_id);
                  fetchGlideTables(mapping.connection_id);
                  
                  // Convert column mappings to available columns for the editor if needed
                  const columns = Object.entries(mapping.column_mappings).map(([id, col]) => ({
                    id,
                    name: col.glide_column_name,
                    type: col.data_type
                  }));
                  setAvailableGlideColumns(columns);
                  setIsDialogOpen(true);
                }}
                onDelete={() => {}}
                onToggle={handleToggleMapping}
                onGoToProductSync={mapping.supabase_table === 'gl_products' ? handleGoToProductSync : undefined}
              />
              <DeleteMappingDialog onDelete={() => handleDeleteMapping(mapping.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MappingsManager;
