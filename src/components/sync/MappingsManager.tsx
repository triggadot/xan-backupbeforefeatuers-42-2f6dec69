
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MappingsList } from './mappings/MappingsList';
import MappingDetails from './mappings/MappingDetails';
import { GlMapping } from '@/types/glsync';
import { useRealtimeMappings } from '@/hooks/useRealtimeMappings';

const MappingsManager = () => {
  const navigate = useNavigate();
  const { refreshMappings } = useRealtimeMappings();
  const [selectedMapping, setSelectedMapping] = useState<GlMapping | null>(null);
  
  // Extract the mapping ID from the URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const mappingIdFromUrl = urlParams.get('id');

  const handleViewMapping = (mapping: GlMapping) => {
    setSelectedMapping(mapping);
    // Update the URL to include the mapping ID
    navigate(`/sync/mappings?id=${mapping.id}`);
  };

  const handleBackToList = () => {
    setSelectedMapping(null);
    // Remove the mapping ID from the URL
    navigate('/sync/mappings');
  };

  // If there's a mapping ID in the URL but no selected mapping yet, we'll render the MappingList
  // which will handle fetching and displaying the mapping details

  return (
    <div>
      {selectedMapping || mappingIdFromUrl ? (
        <MappingDetails 
          mappingId={selectedMapping?.id || mappingIdFromUrl!} 
        />
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Table Mappings</h2>
            <Button variant="outline" onClick={refreshMappings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          <MappingsList 
            onEdit={handleViewMapping}
          />
        </div>
      )}
    </div>
  );
};

export default MappingsManager;
