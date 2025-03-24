
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mapping } from '@/types/syncLog';
import { GlMapping } from '@/types/glsync';
import { convertToGlMapping } from '@/utils/gl-mapping-converters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2, Play, Pause } from 'lucide-react';
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

interface MappingListItemProps {
  mapping: Mapping;
  onEdit: (mapping: GlMapping) => void;
  onDelete: (id: string) => void;
  toggleEnabled: (mapping: Mapping) => void;
}

export const MappingListItem: React.FC<MappingListItemProps> = ({ 
  mapping, 
  onEdit, 
  onDelete,
  toggleEnabled 
}) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Convert the mapping to GlMapping with properly typed column_mappings
  const glMapping = convertToGlMapping(mapping);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(mapping.id);
    } finally {
      setIsDeleting(false);
    }
  };
  
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
              onClick={() => navigate(`/sync/mappings/${mapping.id}`)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
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
                  <AlertDialogCancel>
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
};
