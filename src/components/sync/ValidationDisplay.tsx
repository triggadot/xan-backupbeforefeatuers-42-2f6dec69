
import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface ValidationDisplayProps {
  validation: {
    isValid: boolean;
    message: string;
  } | null;
}

export function ValidationDisplay({ validation }: ValidationDisplayProps) {
  if (!validation) return null;

  return (
    <div className={`p-3 rounded-md ${validation.isValid ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
      <div className="flex items-start gap-2">
        {validation.isValid ? (
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
        )}
        <div>
          <h4 className={`text-sm font-medium ${validation.isValid ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {validation.isValid ? 'Validation Successful' : 'Validation Failed'}
          </h4>
          <p className="text-sm mt-1">{validation.message}</p>
        </div>
      </div>
    </div>
  );
}
