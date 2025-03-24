import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';

// LoadingState Component
export function LoadingState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </CardContent>
    </Card>
  );
}

// InvalidMapping Component
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

// EmptyState Component
interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ 
  title, 
  message, 
  icon = <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />, 
  action 
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-10 text-center">
        {icon}
        {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}
        <p className="text-muted-foreground mb-4">{message}</p>
        {action}
      </CardContent>
    </Card>
  );
} 