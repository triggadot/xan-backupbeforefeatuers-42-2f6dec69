
import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export type ErrorSeverity = 'error' | 'warning' | 'info' | 'success';

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
  
  // Map severity to Alert variant
  // The key fix: Explicitly type this as an object with specific keys mapped to specific variant values
  const variantMap: Record<ErrorSeverity, "default" | "destructive" | "success"> = {
    'error': 'destructive',
    'warning': 'default',
    'info': 'default',
    'success': 'success'
  };
  
  // Determine icon based on severity
  const SeverityIcon = severity === 'error' 
    ? AlertCircle 
    : severity === 'warning' 
      ? AlertTriangle 
      : severity === 'success'
        ? CheckCircle
        : Info;
  
  const defaultTitle = severity === 'error' 
    ? 'Error' 
    : severity === 'warning' 
      ? 'Warning' 
      : severity === 'success'
        ? 'Success'
        : 'Information';
  
  return (
    <Alert variant={variantMap[severity]} className={className}>
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
