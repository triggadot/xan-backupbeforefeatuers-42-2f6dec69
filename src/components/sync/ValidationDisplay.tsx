import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ValidationResult {
  isValid: boolean;
  message: string;
  errors?: string[];
  details?: Record<string, string[]>;
}

interface ValidationDisplayProps {
  validation?: ValidationResult | null;
  mapping?: any;
}

export const ValidationDisplay: React.FC<ValidationDisplayProps> = ({ validation, mapping }) => {
  if (!validation) {
    return null;
  }

  return (
    <Alert variant={validation.isValid ? "success" : "destructive"}>
      <div className="flex items-start">
        <div className="mr-2 mt-0.5">
          {validation.isValid ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
        <div>
          <AlertTitle>
            {validation.isValid ? 'Validation Successful' : 'Validation Failed'}
          </AlertTitle>
          <AlertDescription>
            {validation.message}
            
            {/* Display any errors or details if provided */}
            {!validation.isValid && validation.errors && validation.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-sm">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
            
            {!validation.isValid && validation.details && Object.keys(validation.details).length > 0 && (
              <div className="mt-2 text-sm">
                {Object.entries(validation.details).map(([key, errors]) => (
                  <div key={key} className="mb-1">
                    <strong>{key}:</strong>
                    <ul className="list-disc pl-5">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};
