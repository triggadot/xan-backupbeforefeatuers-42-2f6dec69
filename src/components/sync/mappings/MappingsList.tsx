import { useState } from 'react';
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { GlMapping } from '@/types/glide-sync/glsync';
import { useRealtimeMappings } from '@/hooks/mappings/useRealtimeMappings';
import { MappingListHeader } from './MappingListHeader';
import { MappingListItem } from './MappingListItem';
import { MappingDeleteDialog } from './MappingDeleteDialog';
import { EmptyMappingsList } from './EmptyMappingsList';
import { MappingsListSkeleton } from './MappingsListSkeleton';

interface MappingsListProps {
  onEdit: (mapping: GlMapping) => void;
}

export function MappingsList({ onEdit }: MappingsListProps) {
  const { mappings, isLoading, toggleEnabled, deleteMapping } = useRealtimeMappings();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (mappingId: string) => {
    setDeletingId(mappingId);
    setIsDeleting(true);
    try {
      await deleteMapping(mappingId);
    } finally {
      setDeletingId(null);
      setIsDeleting(false);
    }
  };

  const handleMappingCreated = async () => {
    // Refresh happens automatically via real-time subscription
    return Promise.resolve();
  };

  return (
    <div className="space-y-4">
      <MappingListHeader onMappingCreated={handleMappingCreated} />
      
      {isLoading ? (
        <MappingsListSkeleton />
      ) : mappings.length === 0 ? (
        <EmptyMappingsList />
      ) : (
        mappings.map(mapping => (
          <MappingListItem 
            key={mapping.id}
            mapping={mapping}
            onEdit={onEdit}
            onDelete={handleDelete}
            toggleEnabled={toggleEnabled}
          />
        ))
      )}
      
      {/* Always render the AlertDialog, but control visibility with the open prop */}
      <AlertDialog open={isDeleting}>
        <MappingDeleteDialog isDeleting={isDeleting} />
      </AlertDialog>
    </div>
  );
}
