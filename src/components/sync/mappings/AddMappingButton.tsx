
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GlMapping } from '@/types/glsync';

export function AddMappingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateEmptyMapping = async () => {
    setIsLoading(true);
    try {
      // Get the first connection if available
      const { data: connections, error: connectionError } = await supabase
        .from('gl_connections')
        .select('id')
        .limit(1);
        
      if (connectionError) throw connectionError;
      
      if (!connections || connections.length === 0) {
        toast({
          title: 'No connections available',
          description: 'Please create a connection first before creating a mapping.',
          variant: 'destructive',
        });
        setIsOpen(false);
        navigate('/sync/connections');
        return;
      }
      
      // Create a new empty mapping
      const { data, error } = await supabase
        .from('gl_mappings')
        .insert({
          connection_id: connections[0].id,
          glide_table: 'temp_table',
          glide_table_display_name: 'New Mapping',
          supabase_table: 'gl_products', // Default to products table
          column_mappings: {
            '$rowID': {
              glide_column_name: 'Row ID',
              supabase_column_name: 'glide_row_id',
              data_type: 'string'
            }
          },
          sync_direction: 'to_supabase',
          enabled: false // Disabled by default until configured
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setIsOpen(false);
      toast({
        title: 'Mapping created',
        description: 'Now configure your new mapping',
      });
      
      // Navigate to the edit page for the new mapping
      navigate(`/sync/mappings/edit/${data.id}`);
    } catch (error) {
      console.error('Error creating mapping:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new mapping',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Mapping
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Mapping</DialogTitle>
          <DialogDescription>
            Create a new mapping between a Glide table and a Supabase table.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>This will create a new mapping that you can configure in the next step.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateEmptyMapping} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create & Configure'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
