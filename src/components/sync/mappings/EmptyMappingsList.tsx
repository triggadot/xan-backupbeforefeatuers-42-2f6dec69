
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface EmptyMappingsListProps {
  title?: string;
  description?: string;
}

export const EmptyMappingsList: React.FC<EmptyMappingsListProps> = ({
  title = "No Mappings Found",
  description = "Create a table mapping to sync data between Glide and Supabase."
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
};
