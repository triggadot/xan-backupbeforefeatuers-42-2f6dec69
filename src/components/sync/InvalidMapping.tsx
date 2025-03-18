
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface InvalidMappingProps {
  onBack: () => void;
}

export function InvalidMapping({ onBack }: InvalidMappingProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapping Not Found</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">The requested mapping could not be found or may have been deleted.</p>
        <Button onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Mappings
        </Button>
      </CardContent>
    </Card>
  );
}
