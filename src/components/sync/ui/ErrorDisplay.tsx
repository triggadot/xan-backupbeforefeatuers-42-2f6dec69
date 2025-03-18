import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export type ErrorSeverity = 'error' | 'warning' | 'info';

interface ValidationError {
  message: string;
  field?: string;
  code?: string;
}

interface ErrorDisplayProps {
  errors?: ValidationError[] | string[] | string | null;
  title?: string;
  severity?: ErrorSeverity;
  className?: string;
}

export function ErrorDisplay({
  errors,
  title,
  severity = 'error',
  className = ''
}: ErrorDisplayProps) {
  if (!errors || (Array.isArray(errors) && errors.length === 0)) {
    return null;
  }
  
  // Convert string to array
  const errorList = typeof errors === 'string' 
    ? [{ message: errors }] 
    : Array.isArray(errors)
      ? errors.map(err => typeof err === 'string' ? { message: err } : err)
      : [];
  
  // Determine styling based on severity
  const severityStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };
  
  // Determine icon based on severity
  const SeverityIcon = severity === 'error' 
    ? AlertCircle 
    : severity === 'warning' 
      ? AlertTriangle 
      : Info;
  
  const defaultTitle = severity === 'error' 
    ? 'Error' 
    : severity === 'warning' 
      ? 'Warning' 
      : 'Information';
  
  return (
    <Alert className={`${severityStyles[severity]} ${className}`}>
      <SeverityIcon className="h-4 w-4" />
      <AlertTitle>{title || defaultTitle}</AlertTitle>
      <AlertDescription>
        {errorList.length === 1 ? (
          <p>{errorList[0].message}</p>
        ) : (
          <ul className="ml-6 list-disc mt-2 space-y-1">
            {errorList.map((error, index) => (
              <li key={index} className="text-sm">
                {error.field && <span className="font-medium">{error.field}: </span>}
                {error.message}
              </li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
} 