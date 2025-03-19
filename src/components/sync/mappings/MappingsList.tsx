import React from 'react';
import { Card } from '@/components/ui/card';
import { MappingListItem } from './MappingListItem';
import { MappingListHeader } from './MappingListHeader';
import { GlMapping } from '@/types/glsync';

export interface MappingsListProps {
  mappings: GlMapping[];
  onViewMapping: (mappingId: string) => void;
  onToggleEnabled: (mapping: GlMapping) => Promise<void>;
  onDeleteMapping: (id: string) => Promise<void>;
  isLoading: boolean;
  onMappingCreated: () => Promise<void>;
}

export const MappingsList: React.FC<MappingsListProps> = ({
  mappings,
  onViewMapping,
  onToggleEnabled,
  onDeleteMapping,
  isLoading,
  onMappingCreated
}) => {
  return (
    <Card className="shadow-none">
      <MappingListHeader onMappingCreated={onMappingCreated} />
      <div className="divide-y divide-border">
        {mappings.map((mapping) => (
          <MappingListItem
            key={mapping.id}
            mapping={mapping}
            onViewMapping={onViewMapping}
            onToggleEnabled={onToggleEnabled}
            onDeleteMapping={onDeleteMapping}
            isLoading={isLoading}
          />
        ))}
      </div>
    </Card>
  );
};
