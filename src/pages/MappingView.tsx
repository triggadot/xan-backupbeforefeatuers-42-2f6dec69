
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MappingDetails from '@/components/sync/mappings/MappingDetails';
import SyncLayout from '@/components/sync/SyncLayout';

const MappingView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate('/sync/mappings');
  };

  if (!id) {
    navigate('/sync/mappings');
    return null;
  }
  
  return (
    <SyncLayout>
      <MappingDetails 
        mappingId={id} 
        onBack={handleBack} 
      />
    </SyncLayout>
  );
};

export default MappingView;
