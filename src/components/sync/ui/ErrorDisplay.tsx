
import React from 'react';
import { AlertCircle, InfoIcon, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export type ErrorSeverity = 'error' | 'info' | 'success';

export interface ErrorDisplayProps {
  title?: string;
  errors?: string | string[];
  severity?: ErrorSeverity;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  errors,
  severity = 'error',
}) => {
  if (!errors) return null;

  const formattedErrors = Array.isArray(errors) ? errors : [errors];

  const getIcon = () => {
    switch (severity) {
      case 'info':
        return <InfoIcon className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getAlertClass = () => {
    switch (severity) {
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'error':
      default:
        return 'bg-destructive/10 text-destructive border-destructive/20';
    }
  };

  return (
    <Alert className={getAlertClass()}>
      <div className="flex items-start">
        {getIcon()}
        <div className="ml-2">
          {title && <AlertTitle>{title}</AlertTitle>}
          <AlertDescription>
            {formattedErrors.map((error, index) => (
              <div key={index} className="text-sm">
                {error}
              </div>
            ))}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};
