import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, RefreshCw, Edit, Trash2, ArrowRightLeft, ArrowRight, ArrowLeft, ToggleLeft, ToggleRight, Layers, Box } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import { GlConnection, GlMapping, GlideTable } from '@/types/glsync';
import { supabase } from '@/integrations/supabase/client';
import { GlideTableSelector } from './GlideTableSelector';
import ColumnMappingEditor from './ColumnMappingEditor';

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

    // Fetch Supabase tables
    fetchSupabaseTables();
  }, []);

  const fetchSupabaseTables = async () => {
    try {
      // Get table names from Supabase directly
      const { data, error } = await supabase
        .from('gl_tables_view')
        .select('table_name');
      
      if (error) throw new Error(error.message);
      
      // Extract table names from the response
      const tables = data?.map(item => item.table_name)
        .filter(name => name && name.startsWith('gl_')) || [];
      
      setSupabaseTables(tables);
    } catch (error) {
      console.error('Error fetching Supabase tables:', error);
      // Fallback to hardcoded values if the query fails
      setSupabaseTables(['gl_accounts', 'gl_products', 'gl_invoices', 'gl_estimates']);
    }
  };

  const fetchGlideTables = async (connectionId: string) => {
    setIsLoadingTables(true);
    try {
      const result = await glSyncApi.listGlideTables(connectionId);
      
      if ('tables' in result) {
        setGlideTables(result.tables);
        
        // Add custom tables if they're not already included
        const allTables = [...result.tables];
        
        // Get custom tables from existing mappings
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

    // If a Glide table is selected, try to fetch its columns to prepare for mapping
    if (tableId && selectedConnection) {
      try {
        const result = await glSyncApi.getGlideTableColumns(selectedConnection, tableId);
        if ('columns' in result) {
          // Store available columns for the column mapping editor
          setAvailableGlideColumns(result.columns.map(col => ({
            id: col.id,
            name: col.name,
            type: col.type
          })));
          
          // Automatically create initial column mappings based on column names
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
            // For edit, only add new mappings that don't exist yet
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

      // Ensure we have a display name
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

  const getSyncDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'to_supabase':
        return <ArrowRight className="h-5 w-5" />;
      case 'to_glide':
        return <ArrowLeft className="h-5 w-5" />;
      case 'both':
        return <ArrowRightLeft className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getConnectionName = (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    return connection?.app_name || 'Unnamed App';
  };

  const countColumnMappings = (columnMappings: Record<string, any>) => {
    return Object.keys(columnMappings).length;
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
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="general">General Settings</TabsTrigger>
                  <TabsTrigger 
                    value="column-mappings"
                    disabled={!newMapping.supabase_table && !editMapping?.supabase_table}
                  >
                    Column Mappings
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="py-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="connection">Connection <span className="text-red-500">*</span></Label>
                      <Select
                        value={editMapping?.connection_id || newMapping.connection_id || ''}
                        onValueChange={handleConnectionChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a connection" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Connections</SelectLabel>
                            {connections.map((connection) => (
                              <SelectItem key={connection.id} value={connection.id}>
                                {connection.app_name || 'Unnamed App'}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="glide_table">Glide Table <span className="text-red-500">*</span></Label>
                      <GlideTableSelector
                        tables={glideTables}
                        value={editMapping?.glide_table || newMapping.glide_table || ''}
                        onTableChange={handleGlideTableChange}
                        onAddTable={handleAddGlideTable}
                        disabled={isLoadingTables || !selectedConnection}
                        isLoading={isLoadingTables}
                        placeholder={isLoadingTables ? 'Loading...' : 'Select a Glide table'}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="supabase_table">Supabase Table <span className="text-red-500">*</span></Label>
                      <Select
                        value={editMapping?.supabase_table || newMapping.supabase_table || ''}
                        onValueChange={handleSupabaseTableChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a Supabase table" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Supabase Tables</SelectLabel>
                            {supabaseTables.map((table) => (
                              <SelectItem key={table} value={table}>
                                {table}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="sync_direction">Sync Direction</Label>
                      <Select
                        value={editMapping?.sync_direction || newMapping.sync_direction || 'to_supabase'}
                        onValueChange={(value: 'to_supabase' | 'to_glide' | 'both') => {
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
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="to_supabase">
                            <div className="flex items-center">
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Glide to Supabase
                            </div>
                          </SelectItem>
                          <SelectItem value="to_glide">
                            <div className="flex items-center">
                              <ArrowLeft className="h-4 w-4 mr-2" />
                              Supabase to Glide
                            </div>
                          </SelectItem>
                          <SelectItem value="both">
                            <div className="flex items-center">
                              <ArrowRightLeft className="h-4 w-4 mr-2" />
                              Bidirectional
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enabled">Enabled</Label>
                      <Switch
                        id="enabled"
                        checked={editMapping?.enabled ?? newMapping.enabled ?? true}
                        onCheckedChange={(checked) => {
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
                        }}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="column-mappings" className="py-4">
                  <ColumnMappingEditor 
                    mapping={{ 
                      supabase_table: editMapping?.supabase_table || newMapping.supabase_table || '',
                      column_mappings: editMapping?.column_mappings || newMapping.column_mappings || {}
                    }}
                    onUpdate={handleColumnMappingsChange}
                  />
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editMapping ? handleUpdateMapping : handleCreateMapping}>
                  {editMapping ? 'Update' : 'Create'}
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
            <Card key={mapping.id} className="p-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-medium">
                      {getConnectionName(mapping.connection_id)}
                    </h3>
                    {mapping.enabled ? (
                      <Badge className="bg-green-500">Enabled</Badge>
                    ) : (
                      <Badge variant="outline">Disabled</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <span>{mapping.glide_table_display_name || mapping.glide_table}</span>
                    <span className="mx-2">
                      {getSyncDirectionIcon(mapping.sync_direction)}
                    </span>
                    <span>{mapping.supabase_table}</span>
                  </div>
                  
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <Layers className="h-4 w-4 mr-1" />
                    <span>{countColumnMappings(mapping.column_mappings)} column mappings</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                  {mapping.supabase_table === 'gl_products' && (
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleGoToProductSync(mapping)}
                    >
                      <Box className="h-4 w-4 mr-2" />
                      Sync Products
                    </Button>
                  )}
                
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleToggleMapping(mapping)}
                  >
                    {mapping.enabled ? (
                      <>
                        <ToggleRight className="h-4 w-4 mr-2" />
                        Disable
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-4 w-4 mr-2" />
                        Enable
                      </>
                    )}
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
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
                        }}
                      >
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
                        <AlertDialogTitle>Delete Mapping</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this mapping? This will stop any synchronization between these tables.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteMapping(mapping.id)}
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

export default MappingsManager;
