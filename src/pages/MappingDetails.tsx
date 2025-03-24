
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MappingDetailsCard } from '@/components/sync/MappingDetailsCard';
import { MappingTabs } from '@/components/sync/MappingTabs';
import { AlertDialog, AlertDialogContent, AlertDialogAction, AlertDialogCancel, 
         AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, 
         AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlMapping, GlSyncRecord } from '@/types/glsync';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';
import { useGlSyncErrors } from '@/hooks/useGlSyncErrors';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';
import SyncContainer from '@/components/sync/SyncContainer';

export default function MappingDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  
  // Get mapping details
  const { data: mapping, isLoading: isMappingLoading, error } = useQuery({
    queryKey: ['mapping', id],
    queryFn: async () => {
      if (!id) throw new Error('Mapping ID is required');

      const { data, error } = await supabase
        .from('gl_mappings')
        .select('*, gl_connections(app_name)')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        connection_id: data.connection_id,
        column_mappings: data.column_mappings as unknown as Record<string, { 
          glide_column_name: string;
          supabase_column_name: string;
          data_type: 'string' | 'number' | 'boolean' | 'date-time' | 'image-uri' | 'email-address';
        }>,
        // Add the app_name property from the joined connection
        app_name: data.gl_connections?.app_name
      } as GlMapping & { app_name?: string };
    },
    enabled: !!id,
    meta: {
      onError: (error: any) => {
        toast({
          title: 'Error fetching mapping',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  });
  
  // Get sync status
  const { syncStatus, refreshStatus } = useGlSyncStatus(id || '');
  
  // Get sync errors
  const { syncErrors, isLoading: isErrorsLoading, fetchSyncErrors } = useGlSyncErrors(id || '');
  
  // Check if the mapping has an explicit RowID mapping
  const hasRowIdMapping = mapping ? Object.entries(mapping.column_mappings)
    .some(([key]) => key === '$rowID') : false;
  
  const handleBack = () => {
    navigate('/sync/mappings');
  };
  
  const handleEdit = (mapping: GlMapping) => {
    // Navigate to edit page (for future implementation)
    navigate(`/sync/mappings/edit/${mapping.id}`);
  };
  
  const handleDelete = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('gl_mappings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Mapping deleted',
        description: 'The mapping has been successfully deleted',
      });
      
      navigate('/sync/mappings');
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete mapping',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };
  
  const refreshData = async () => {
    await Promise.all([
      refreshStatus(),
      fetchSyncErrors(false)
    ]);
  };
  
  useEffect(() => {
    refreshData();
  }, [id]);
  
  if (isMappingLoading) {
    return (
      <SyncContainer>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </SyncContainer>
    );
  }
  
  if (error || !mapping) {
    return (
      <SyncContainer>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load mapping details. {error instanceof Error ? error.message : ''}</p>
            <Button onClick={handleBack} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Mappings
            </Button>
          </CardContent>
        </Card>
      </SyncContainer>
    );
  }
  
  return (
    <SyncContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Mappings
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete Mapping
          </Button>
        </div>
        
        <MappingDetailsCard
          mapping={mapping}
          connectionName={(mapping as any).app_name || 'Unknown'}
          status={syncStatus}
          onEdit={() => handleEdit(mapping)}
          onDelete={() => setShowDeleteDialog(true)}
          onSyncComplete={refreshData}
        />
        
        <MappingTabs
          mapping={mapping}
          syncErrors={syncErrors}
          hasRowIdMapping={hasRowIdMapping}
          onRefreshErrors={fetchSyncErrors}
        />
      </div>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mapping</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this mapping? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SyncContainer>
  );
}
