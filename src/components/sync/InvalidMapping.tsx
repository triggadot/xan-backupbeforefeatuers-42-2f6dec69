
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

interface InvalidMappingProps {
  onBackClick: () => void;
}

export function InvalidMapping({ onBackClick }: InvalidMappingProps) {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardContent className="p-6">
          <p>Invalid mapping ID. Please select a valid mapping.</p>
          <Button variant="outline" onClick={onBackClick} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sync
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
