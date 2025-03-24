
import { useParams } from 'react-router-dom';
import { MappingDetails as SyncMappingDetails } from '@/components/sync/mappings/MappingDetails';
import SyncContainer from '@/components/sync/SyncContainer';

export default function MappingDetails() {
  const { id } = useParams<{ id: string }>();
  
  return (
    <SyncContainer>
      <SyncMappingDetails mappingId={id || ''} onBack={() => window.history.back()} />
    </SyncContainer>
  );
}
