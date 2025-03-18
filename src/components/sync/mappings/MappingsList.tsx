import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlMapping } from '@/types/glsync';
import { Mapping } from '@/types/syncLog';
import { Button } from '@/components/ui/button';
import { AddMappingButton } from './AddMappingButton';
import { CreateSchemaButton } from './CreateSchemaButton';
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
} from "@/components/ui/alert-dialog";
import { Eye, Trash2, Play, Pause } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { convertToGlMapping } from '@/utils/gl-mapping-converters';
import { useRealtimeMappings } from '@/hooks/useRealtimeMappings';

interface MappingsListProps {
  onEdit: (mapping: GlMapping) => void;
}

export function MappingsList({ onEdit }: MappingsListProps) {
  const navigate = useNavigate();
  const { mappings, isLoading, toggleEnabled, deleteMapping } = useRealtimeMappings();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingId) return;
    
    setIsDeleting(true);
    try {
      await deleteMapping(deletingId);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Table Mappings</h2>
        <div className="flex items-center space-x-2">
          <CreateSchemaButton onMappingCreated={() => {
            // Refresh happens automatically via real-time subscription
            return Promise.resolve();
          }} />
          <AddMappingButton onSuccess={async () => {
            // Refresh happens automatically via real-time subscription
            return Promise.resolve();
          }} />
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : mappings.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Mappings Found</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Create a table mapping to sync data between Glide and Supabase.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        mappings.map(mapping => {
          // Convert the mapping to GlMapping with properly typed column_mappings
          const glMapping = convertToGlMapping(mapping);
          
          return (
            <Card key={mapping.id} className={mapping.enabled ? '' : 'opacity-70'}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl flex items-center">
                    {mapping.glide_table_display_name || mapping.glide_table}
                    {!mapping.enabled && (
                      <Badge variant="outline" className="ml-2">
                        Disabled
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleEnabled(mapping)}
                    >
                      {mapping.enabled ? (
                        <Pause className="h-4 w-4 mr-1" />
                      ) : (
                        <Play className="h-4 w-4 mr-1" />
                      )}
                      {mapping.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(glMapping)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingId(mapping.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Mapping</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this mapping? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeletingId(null)}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              e.preventDefault();
                              handleDelete();
                            }}
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <CardDescription>
                  Maps <span className="font-medium">{mapping.glide_table}</span> to <span className="font-medium">{mapping.supabase_table}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Direction:</span>{' '}
                  {mapping.sync_direction === 'to_supabase'
                    ? 'Glide → Supabase'
                    : mapping.sync_direction === 'to_glide'
                    ? 'Supabase → Glide'
                    : 'Bidirectional'}
                </div>
                {mapping.supabase_table === 'gl_products' && (
                  <Button
                    className="mt-4"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/sync/products/${mapping.id}`)}
                  >
                    Go to Product Sync
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
      
      <AlertDialog>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deleting Mapping</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-2">Deleting...</span>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
