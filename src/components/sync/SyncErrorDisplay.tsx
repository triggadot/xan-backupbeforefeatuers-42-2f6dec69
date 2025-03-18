
import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { GlSyncRecord } from '@/types/glsync';
import { formatTimestamp } from '@/utils/glsync-transformers';
import { useGlSyncErrors } from '@/hooks/useGlSyncErrors';

interface SyncErrorDisplayProps {
  syncErrors: GlSyncRecord[];
  onRefresh: () => void;
  mappingId?: string;
}

const SyncErrorDisplay: React.FC<SyncErrorDisplayProps> = ({ 
  syncErrors, 
  onRefresh,
  mappingId 
}) => {
  const [selectedError, setSelectedError] = useState<GlSyncRecord | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [includeResolved, setIncludeResolved] = useState(false);
  const { resolveError } = useGlSyncErrors(mappingId);
  
  const getErrorTypeIcon = (type: string) => {
    switch (type) {
      case 'VALIDATION_ERROR':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'TRANSFORM_ERROR':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'API_ERROR':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'RATE_LIMIT':
        return <AlertTriangle className="h-5 w-5 text-blue-500" />;
      case 'NETWORK_ERROR':
        return <AlertTriangle className="h-5 w-5 text-purple-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const getErrorTypeBadge = (type: string) => {
    switch (type) {
      case 'VALIDATION_ERROR':
        return <Badge variant="destructive">Validation Error</Badge>;
      case 'TRANSFORM_ERROR':
        return <Badge className="bg-amber-500">Transform Error</Badge>;
      case 'API_ERROR':
        return <Badge className="bg-orange-500">API Error</Badge>;
      case 'RATE_LIMIT':
        return <Badge className="bg-blue-500">Rate Limit</Badge>;
      case 'NETWORK_ERROR':
        return <Badge className="bg-purple-500">Network Error</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const handleResolveError = async () => {
    if (!selectedError?.id) return;
    
    const success = await resolveError(selectedError.id, resolutionNotes);
    if (success) {
      setSelectedError(null);
      setResolutionNotes('');
      onRefresh();
    }
  };

  const toggleIncludeResolved = () => {
    setIncludeResolved(!includeResolved);
    if (mappingId) {
      // This will re-fetch with the new includeResolved flag
      onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Sync Errors</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={toggleIncludeResolved}>
            {includeResolved ? 'Hide Resolved' : 'Show Resolved'}
          </Button>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {syncErrors.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">No sync errors found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {syncErrors.map((error) => (
            <Card key={error.id} className={error.resolved ? 'bg-gray-50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start">
                  <div className="mr-4 mt-1">
                    {getErrorTypeIcon(error.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          {getErrorTypeBadge(error.type)}
                          {error.resolved && (
                            <Badge variant="outline" className="bg-green-50">Resolved</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium">{error.message}</p>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {formatTimestamp(error.timestamp)}
                      </p>
                    </div>
                    
                    {error.resolved && error.resolution_notes && (
                      <div className="mt-2 p-2 bg-green-50 rounded-md text-sm">
                        <p className="font-medium">Resolution:</p>
                        <p>{error.resolution_notes}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-end mt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedError(error)}
                          >
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              {getErrorTypeIcon(error.type)}
                              <span>Error Details</span>
                              {getErrorTypeBadge(error.type)}
                            </DialogTitle>
                            <DialogDescription>
                              {formatTimestamp(error.timestamp)}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 mt-2">
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Error Message</h4>
                              <p className="text-sm">{error.message}</p>
                            </div>
                            
                            {error.record && (
                              <div>
                                <h4 className="text-sm font-semibold mb-1">Record Data</h4>
                                <pre className="text-xs p-2 bg-gray-100 rounded-md overflow-auto max-h-40">
                                  {JSON.stringify(error.record, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            {error.retryable && (
                              <div className="text-sm">
                                <Badge className="bg-blue-500">Retriable</Badge>
                                <span className="ml-2">This error can be retried.</span>
                              </div>
                            )}
                            
                            {!error.resolved && (
                              <div>
                                <h4 className="text-sm font-semibold mb-1">Resolution Notes</h4>
                                <Textarea
                                  placeholder="Enter notes about how this error was resolved..."
                                  value={resolutionNotes}
                                  onChange={(e) => setResolutionNotes(e.target.value)}
                                  className="w-full"
                                  rows={3}
                                />
                              </div>
                            )}
                            
                            {error.resolved && error.resolution_notes && (
                              <div>
                                <h4 className="text-sm font-semibold mb-1">Resolution Notes</h4>
                                <div className="p-2 bg-green-50 rounded-md">
                                  {error.resolution_notes}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Close</Button>
                            </DialogClose>
                            
                            {!error.resolved && (
                              <Button onClick={handleResolveError}>
                                Mark as Resolved
                              </Button>
                            )}
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SyncErrorDisplay;
