
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface ValidationResult {
  isValid: boolean;
  message: string;
  errors?: string[];
  details?: Record<string, string[]>;
}

interface ValidationDisplayProps {
  validation: ValidationResult | null;
}

export function ValidationDisplay({ validation }: ValidationDisplayProps) {
  if (!validation) return null;

  return (
    <>
      {validation && (
        <Alert variant={validation.isValid ? "default" : "destructive"} className={validation.isValid ? "border-green-500" : ""}>
          {validation.isValid ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>{validation.isValid ? 'Valid Configuration' : 'Invalid Configuration'}</AlertTitle>
          <AlertDescription>
            {validation.message}
            {!validation.isValid && validation.details && Object.keys(validation.details).length > 0 && (
              <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                {Object.entries(validation.details).map(([key, errors]) => (
                  <li key={key}>
                    <span className="font-medium">{key}:</span> {errors.join(', ')}
                  </li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
