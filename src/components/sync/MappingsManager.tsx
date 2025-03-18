
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GlConnection, GlMapping } from '@/types/glsync';
import MappingCard from './mappings/MappingCard';
import DeleteMappingDialog from './mappings/DeleteMappingDialog';
import AddMappingDialog from './mappings/AddMappingDialog';
import EditMappingDialog from './mappings/EditMappingDialog';
import { useMappingOperations } from '@/hooks/useMappingOperations';

const MappingsManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAddMappingOpen, setIsAddMappingOpen] = useState(false);
  const [isEditMappingOpen, setIsEditMappingOpen] = useState(false);
  const [isDeleteMappingOpen, setIsDeleteMappingOpen] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<GlMapping | null>(null);
  const { deleteMapping } = useMappingOperations();

  // Fetch mappings with React Query
  const { 
    data: mappings = [], 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gl_mappings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(mapping => ({
        ...mapping,
        column_mappings: mapping.column_mappings as unknown as Record<string, { 
          glide_column_name: string;
          supabase_column_name: string;
          data_type: 'string' | 'number' | 'boolean' | 'date-time' | 'image-uri' | 'email-address';
        }>
      })) as GlMapping[];
    },
    meta: {
      onError: (error: any) => {
        console.error('Error fetching mappings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load mappings',
          variant: 'destructive',
        });
      }
    }
  });

  // Fetch connections for display purposes
  const { 
    data: connections = []
  } = useQuery({
    queryKey: ['connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gl_connections')
        .select('id, app_name')
        .order('app_name', { ascending: true });
      
      if (error) throw error;
      return data as GlConnection[];
    }
  });

  const handleAddMapping = () => {
    setIsAddMappingOpen(true);
  };

  const handleEditMapping = (mapping: GlMapping) => {
    setSelectedMapping(mapping);
    setIsEditMappingOpen(true);
  };

  const handleDeleteMapping = (mapping: GlMapping) => {
    setSelectedMapping(mapping);
    setIsDeleteMappingOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedMapping) return;
    
    const success = await deleteMapping(selectedMapping.id);
    if (success) {
      setIsDeleteMappingOpen(false);
      refetch();
    }
  };

  const handleToggleMapping = async (mapping: GlMapping) => {
    try {
      const { data, error } = await supabase
        .from('gl_mappings')
        .update({ enabled: !mapping.enabled })
        .eq('id', mapping.id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: `Mapping ${data.enabled ? 'enabled' : 'disabled'}`,
        description: `The table mapping has been ${data.enabled ? 'enabled' : 'disabled'} successfully.`,
      });
      
      refetch();
    } catch (error) {
      console.error('Error toggling mapping:', error);
      toast({
        title: 'Error',
        description: 'Failed to update mapping status',
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
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button onClick={handleAddMapping}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Mapping
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
                onEdit={() => handleEditMapping(mapping)}
                onDelete={() => handleDeleteMapping(mapping)}
                onToggle={() => handleToggleMapping(mapping)}
                onGoToProductSync={mapping.supabase_table === 'gl_products' ? () => handleGoToProductSync(mapping) : undefined}
              />
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddMappingDialog 
        open={isAddMappingOpen}
        onOpenChange={setIsAddMappingOpen}
        onSuccess={() => refetch()}
      />
      
      {selectedMapping && (
        <>
          <EditMappingDialog
            open={isEditMappingOpen}
            onOpenChange={setIsEditMappingOpen}
            mapping={selectedMapping}
            onSuccess={() => {
              refetch();
              setSelectedMapping(null);
            }}
          />
          
          <DeleteMappingDialog
            open={isDeleteMappingOpen}
            onOpenChange={setIsDeleteMappingOpen}
            mapping={selectedMapping}
            onSuccess={() => handleConfirmDelete()}
            onDelete={() => handleConfirmDelete()}
          />
        </>
      )}
    </div>
  );
};

export default MappingsManager;
