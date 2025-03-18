
import React from 'react';
import { RefreshCw, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GlSyncRecord } from '@/types/glsync';

interface SyncErrorDisplayProps {
  syncErrors: GlSyncRecord[];
  onRefresh?: () => void;
  className?: string;
}

const SyncErrorDisplay: React.FC<SyncErrorDisplayProps> = ({ 
  syncErrors, 
  onRefresh,
  className = '' 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getErrorTypeBadge = (type: string) => {
    switch (type) {
      case 'VALIDATION_ERROR':
        return <Badge className="bg-amber-500">Validation</Badge>;
      case 'TRANSFORM_ERROR':
        return <Badge className="bg-orange-500">Transform</Badge>;
      case 'API_ERROR':
        return <Badge className="bg-red-500">API</Badge>;
      case 'RATE_LIMIT':
        return <Badge className="bg-blue-500">Rate Limit</Badge>;
      case 'NETWORK_ERROR':
        return <Badge className="bg-purple-500">Network</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center text-lg">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          Sync Errors
        </CardTitle>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {syncErrors.length === 0 ? (
          <p className="text-center text-muted-foreground">No errors found.</p>
        ) : (
          <Accordion type="multiple" className="w-full">
            {syncErrors.map((error, index) => (
              <AccordionItem value={`error-${index}`} key={index}>
                <AccordionTrigger className="py-4">
                  <div className="flex items-center gap-3 text-left">
                    {getErrorTypeBadge(error.type)}
                    <span className="font-medium">{error.message}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDate(error.timestamp)}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {error.record ? (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium mb-2">Record Data:</p>
                      <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded">
                        {JSON.stringify(error.record, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No record data available.</p>
                  )}
                  
                  <div className="flex items-center justify-between mt-4">
                    <Badge variant={error.retryable ? "default" : "outline"}>
                      {error.retryable ? "Retryable" : "Not Retryable"}
                    </Badge>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default SyncErrorDisplay;
