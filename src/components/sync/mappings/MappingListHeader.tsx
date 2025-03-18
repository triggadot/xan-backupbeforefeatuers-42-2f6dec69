
import React from 'react';
import { AddMappingButton } from './AddMappingButton';
import { CreateSchemaButton } from './CreateSchemaButton';

interface MappingListHeaderProps {
  onMappingCreated: () => Promise<void>;
}

export const MappingListHeader: React.FC<MappingListHeaderProps> = ({ onMappingCreated }) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Table Mappings</h2>
      <div className="flex items-center space-x-2">
        <CreateSchemaButton onMappingCreated={onMappingCreated} />
        <AddMappingButton onSuccess={onMappingCreated} />
      </div>
    </div>
  );
};
