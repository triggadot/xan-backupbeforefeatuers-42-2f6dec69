
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, RefreshCw, Edit, Trash2, ArrowRight, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AddMappingDialog from './AddMappingDialog';
import DeleteMappingDialog from './DeleteMappingDialog';
import { formatDateTime } from '@/utils/date-utils';

interface Mapping {
  id: string;
  connection_id: string;
  app_name: string;
  glide_table: string;
  glide_table_display_name: string;
  supabase_table: string;
  enabled: boolean;
  sync_direction: string;
  current_status: string;
  last_sync_completed_at: string | null;
  error_count: number;
}

const MappingsList: React.FC = () => {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<Mapping | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchMappings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gl_mapping_status')
        .select('*')
        .order('last_sync_started_at', { ascending: false });
      
      if (error) throw error;
      setMappings(data || []);
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

  useEffect(() => {
    fetchMappings();
    
    // Set up realtime subscription for mapping changes
    const mappingsChannel = supabase
      .channel('gl_mappings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gl_mapping_status' }, 
        () => {
          fetchMappings();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(mappingsChannel);
    };
  }, []);

  const handleToggleEnabled = async (id: string, currentEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('gl_mappings')
        .update({ enabled: !currentEnabled })
        .eq('id', id);
      
      if (error) throw error;
      
      // Show toast
      toast({
        title: 'Mapping updated',
        description: `Mapping ${currentEnabled ? 'disabled' : 'enabled'} successfully`,
      });
      
      // Refresh mappings
      fetchMappings();
    } catch (error) {
      console.error('Error toggling mapping:', error);
      toast({
        title: 'Error',
        description: 'Failed to update mapping',
        variant: 'destructive',
      });
    }
  };

  const handleAddMapping = () => {
    setShowAddDialog(true);
  };

  const handleEditMapping = (id: string) => {
    navigate(`/sync/mappings/${id}`);
  };

  const handleDeleteMapping = (mapping: Mapping) => {
    setSelectedMapping(mapping);
    setShowDeleteDialog(true);
  };

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    fetchMappings();
    toast({
      title: 'Mapping added',
      description: 'New mapping has been added successfully',
    });
  };

  const handleDeleteSuccess = () => {
    setShowDeleteDialog(false);
    fetchMappings();
  };

  const getSyncDirectionLabel = (direction: string) => {
    switch (direction) {
      case 'to_supabase':
        return <Badge>Glide → Supabase</Badge>;
      case 'to_glide':
        return <Badge>Supabase → Glide</Badge>;
      case 'both':
        return <Badge>Bidirectional</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
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
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Table Mappings</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchMappings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAddMapping}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Mapping
          </Button>
        </div>
      </div>

      {mappings.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No mappings found</p>
          <p className="mt-2">Create a mapping to start syncing data</p>
          <Button className="mt-4" onClick={handleAddMapping}>
            Add Mapping
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {mappings.map((mapping) => (
            <Card key={mapping.id} className="p-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium mr-3">
                      {mapping.glide_table_display_name || mapping.glide_table} → {mapping.supabase_table}
                    </h3>
                    {getSyncDirectionLabel(mapping.sync_direction)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    App: {mapping.app_name || 'Unnamed App'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Last Synced: {formatDateTime(mapping.last_sync_completed_at)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                  <div className="flex items-center mr-4">
                    <Switch
                      checked={mapping.enabled}
                      onCheckedChange={() => handleToggleEnabled(mapping.id, mapping.enabled)}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      {mapping.enabled ? (
                        <ToggleRight className="h-5 w-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </span>
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={() => navigate(`/sync/mappings/${mapping.id}`)}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={() => handleEditMapping(mapping.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={() => handleDeleteMapping(mapping)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddMappingDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleAddSuccess}
      />

      {selectedMapping && (
        <DeleteMappingDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          mapping={selectedMapping}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
};

export default MappingsList;
