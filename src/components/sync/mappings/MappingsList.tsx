
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mapping } from '@/types/syncLog';
import MappingCard from './MappingCard';
import { supabase } from '@/integrations/supabase/client';
import AddMappingButton from './AddMappingButton';
import { Loader2, RefreshCw } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

const MappingsList = () => {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gl_mappings')
        .select(`
          *,
          gl_connections (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Convert the data to the expected Mapping type
      const formattedMappings = data.map(item => {
        return {
          ...item,
          app_name: item.gl_connections?.app_name || 'Unknown App',
          column_mappings: item.column_mappings as Record<string, {
            glide_column_name: string;
            supabase_column_name: string;
            data_type: string;
          }>
        } as Mapping;
      });
      
      setMappings(formattedMappings);
    } catch (error) {
      console.error('Error fetching mappings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load mappings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMapping = async (mapping: Mapping) => {
    try {
      const { data, error } = await supabase
        .from('gl_mappings')
        .update({ enabled: !mapping.enabled })
        .eq('id', mapping.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update the local state with the updated mapping
      setMappings(prevMappings => 
        prevMappings.map(m => 
          m.id === mapping.id ? { ...m, enabled: !mapping.enabled } : m
        )
      );
      
      toast({
        title: `Mapping ${!mapping.enabled ? 'enabled' : 'disabled'}`,
        description: `The table mapping has been ${!mapping.enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      console.error('Error toggling mapping:', error);
      toast({
        title: 'Error',
        description: 'Failed to update mapping status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMapping = async (mappingId: string) => {
    try {
      const { error } = await supabase
        .from('gl_mappings')
        .delete()
        .eq('id', mappingId);
      
      if (error) throw error;
      
      // Remove the deleted mapping from the local state
      setMappings(prevMappings => prevMappings.filter(m => m.id !== mappingId));
      
      toast({
        title: 'Mapping deleted',
        description: 'The table mapping has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete mapping',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Table Mappings</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchMappings}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <AddMappingButton onSuccess={fetchMappings} />
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
            <MappingCard
              key={mapping.id}
              mapping={mapping}
              onView={() => navigate(`/sync/mappings/${mapping.id}`)}
              onToggle={() => handleToggleMapping(mapping)}
              onDelete={() => handleDeleteMapping(mapping.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MappingsList;
