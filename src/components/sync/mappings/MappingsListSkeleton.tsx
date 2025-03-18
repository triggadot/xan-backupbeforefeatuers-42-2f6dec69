
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const MappingsListSkeleton: React.FC = () => {
  return (
    <div className="grid gap-4">
      {[1, 2, 3].map(i => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
