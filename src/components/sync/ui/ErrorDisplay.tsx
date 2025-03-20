
import React from 'react';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export type ErrorSeverity = 'error' | 'warning' | 'info';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  severity?: ErrorSeverity;
  errors?: string | string[];
}

export function ErrorDisplay({ 
  title = 'Error', 
  message, 
  errors,
  onRetry,
  severity = 'error'
}: ErrorDisplayProps) {
  // Use errors prop if provided, otherwise use message
  const displayMessage = errors || message;
  
  // Format array of errors as a list
  const formattedMessage = Array.isArray(displayMessage) 
    ? displayMessage.join('\n') 
    : displayMessage;
  
  // Select variant based on severity
  const variant = severity === 'error' ? 'destructive' : 
                  severity === 'warning' ? 'default' : 
                  'default';
  
  // Select icon based on severity
  const Icon = severity === 'error' ? AlertTriangle : 
               severity === 'warning' ? AlertCircle : 
               Info;
  
  return (
    <Alert variant={variant}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2 whitespace-pre-line">{formattedMessage}</p>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRetry}
            className="mt-2"
          >
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
