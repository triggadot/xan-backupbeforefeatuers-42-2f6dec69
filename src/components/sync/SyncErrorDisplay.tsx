
import React from 'react';
import { SyncErrorRecord } from '@/types/glsync';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  AlertCircle,
  AlertTriangle,
  Info,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncErrorDisplayProps {
  errors: SyncErrorRecord[];
  maxErrors?: number;
  className?: string;
}

const SyncErrorDisplay: React.FC<SyncErrorDisplayProps> = ({ 
  errors, 
  maxErrors = 10,
  className
}) => {
  if (!errors || errors.length === 0) {
    return null;
  }

  const displayErrors = errors.slice(0, maxErrors);
  const hasMore = errors.length > maxErrors;

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'VALIDATION_ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'TRANSFORM_ERROR':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'API_ERROR':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'RATE_LIMIT':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className={cn("border rounded-md p-4 bg-gray-50", className)}>
      <h3 className="text-lg font-medium mb-4">Sync Errors</h3>
      
      <Accordion type="single" collapsible className="w-full">
        {displayErrors.map((error, index) => (
          <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center text-left">
                {getErrorIcon(error.type)}
                <div className="ml-2 font-medium">
                  <span className="text-sm">{error.message}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {formatTimestamp(error.timestamp)}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="py-2 px-4 bg-white rounded text-sm">
              <div className="grid gap-2">
                <div className="flex items-center">
                  <span className="font-medium mr-2">Error Type:</span>
                  <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-100">
                    {error.type}
                  </span>
                </div>
                
                {error.retryable !== undefined && (
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Retryable:</span>
                    <span className={cn(
                      "px-2 py-1 rounded-md text-xs font-medium",
                      error.retryable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    )}>
                      {error.retryable ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
                
                {error.record && (
                  <div>
                    <span className="font-medium block mb-1">Record Data:</span>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(error.record, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      {hasMore && (
        <div className="mt-2 text-sm text-gray-500">
          Showing {displayErrors.length} of {errors.length} errors
        </div>
      )}
    </div>
  );
};

export default SyncErrorDisplay;
