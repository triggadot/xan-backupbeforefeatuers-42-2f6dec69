import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddMappingButton } from './mappings/AddMappingButton';
import { MappingsList } from './mappings/MappingsList';
import MappingDetails from './mappings/MappingDetails';
import { useRealtimeMappings } from '@/hooks/useRealtimeMappings';
import { MappingsListSkeleton } from './mappings/MappingsListSkeleton';
import { EmptyMappingsList } from './mappings/EmptyMappingsList';

interface MappingsManagerProps {
  connectionId?: string;
}

const MappingsManager: React.FC<MappingsManagerProps> = ({ connectionId }) => {
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(null);
  const { mappings, isLoading, toggleEnabled, deleteMapping, refreshMappings } = useRealtimeMappings();

  const handleViewMapping = (mappingId: string) => {
    setSelectedMappingId(mappingId);
  };

  const handleBack = () => {
    setSelectedMappingId(null);
  };

  // If a specific mapping is selected, show its details
  if (selectedMappingId) {
    return (
      <MappingDetails 
        mappingId={selectedMappingId} 
        onBack={handleBack} 
      />
    );
  }

  // Otherwise, show the list of mappings
  return (
    <div className="container mx-auto px-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Table Mappings</h1>
        <AddMappingButton onMappingAdded={refreshMappings} connectionId={connectionId} />
      </div>

      {connectionId && (
        <p className="mb-4 text-muted-foreground">
          Viewing mappings for selected connection only.{' '}
          <Button 
            variant="link" 
            className="p-0 h-auto text-primary" 
            onClick={() => window.location.href = '/sync/mappings'}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            View all mappings
          </Button>
        </p>
      )}

      {isLoading ? (
        <MappingsListSkeleton />
      ) : mappings.length === 0 ? (
        <EmptyMappingsList connectionId={connectionId} />
      ) : (
        <MappingsList 
          mappings={mappings}
          onViewMapping={handleViewMapping}
          onToggleEnabled={toggleEnabled}
          onDeleteMapping={deleteMapping}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default MappingsManager;
