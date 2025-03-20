
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const EmptyMappingsList: React.FC = () => {
  return (
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
  );
};
