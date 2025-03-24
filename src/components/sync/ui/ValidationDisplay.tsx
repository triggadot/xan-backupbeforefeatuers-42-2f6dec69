
import React from 'react';
import { Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ValidationResult {
  isValid: boolean;
  message: string;
  details?: Record<string, string[]>;
}

interface ValidationDisplayProps {
  validation: ValidationResult | null;
  isValidating?: boolean;
}

export function ValidationDisplay({ 
  validation,
  isValidating = false
}: ValidationDisplayProps) {
  if (isValidating) {
    return (
      <Alert className="bg-blue-50 text-blue-800 border-blue-200">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        <AlertTitle>Validating</AlertTitle>
        <AlertDescription>
          Checking mapping configuration...
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!validation) {
    return null;
  }
  
  if (validation.isValid) {
    return (
      <Alert className="bg-green-50 text-green-800 border-green-200">
        <Check className="h-4 w-4 text-green-500" />
        <AlertTitle>Valid Configuration</AlertTitle>
        <AlertDescription>
          {validation.message}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Alert className="bg-amber-50 text-amber-800 border-amber-200">
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <AlertTitle>Validation Issues</AlertTitle>
      <AlertDescription>
        <p>{validation.message}</p>
        {validation.details && (
          <ul className="list-disc pl-5 mt-2 space-y-1">
            {Object.entries(validation.details).map(([field, errors]) => (
              <li key={field}>
                <strong>{field}:</strong> {errors.join(', ')}
              </li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}
