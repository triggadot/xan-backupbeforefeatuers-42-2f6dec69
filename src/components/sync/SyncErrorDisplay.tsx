
import React, { useState } from 'react';
import { GlSyncRecord } from '@/types/glsync';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

interface SyncErrorDisplayProps {
  syncErrors: GlSyncRecord[];
  onResolve?: (errorId: string, notes?: string) => Promise<boolean>;
  onRefresh?: (includeResolved?: boolean) => Promise<void>;
  className?: string;
}

export function SyncErrorDisplay({ 
  syncErrors, 
  onResolve,
  onRefresh,
  className = ''
}: SyncErrorDisplayProps) {
  const [expandedErrors, setExpandedErrors] = useState<Record<string, boolean>>({});
  const [isResolvingError, setIsResolvingError] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [includeResolved, setIncludeResolved] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const toggleErrorExpanded = (errorId: string) => {
    setExpandedErrors(prev => ({
      ...prev,
      [errorId]: !prev[errorId]
    }));
  };
  
  const handleResolveError = async () => {
    if (!isResolvingError || !onResolve) return;
    
    try {
      const success = await onResolve(isResolvingError, resolutionNotes);
      if (success) {
        setIsResolvingError(null);
        setResolutionNotes('');
      }
    } catch (error) {
      console.error('Error resolving sync error:', error);
    }
  };
  
  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh(includeResolved);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const getErrorTypeIcon = (errorType: string) => {
    switch (errorType) {
      case 'VALIDATION_ERROR':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'TRANSFORM_ERROR':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'API_ERROR':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'RATE_LIMIT':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'NETWORK_ERROR':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Badge variant={includeResolved ? 'default' : 'outline'}>
            {syncErrors.length} Error{syncErrors.length !== 1 ? 's' : ''}
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIncludeResolved(!includeResolved)}
          >
            {includeResolved ? 'Hide Resolved' : 'Show Resolved'}
          </Button>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {syncErrors.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
            <p className="text-lg font-medium mb-1">No Errors Found</p>
            <p className="text-muted-foreground">
              Synchronization is working correctly.
            </p>
          </CardContent>
        </Card>
      ) : (
        syncErrors.map(error => (
          <Card 
            key={error.id}
            className={error.resolved ? 'opacity-60 border-gray-200' : 'border-red-200'}
          >
            <CardHeader className="py-3 px-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2">
                  {getErrorTypeIcon(error.type)}
                  <div>
                    <CardTitle className="text-base">
                      {error.type}
                      {error.resolved && (
                        <Badge variant="outline" className="ml-2 bg-green-50 text-green-600">
                          Resolved
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(error.timestamp), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleErrorExpanded(error.id!)}
                >
                  {expandedErrors[error.id!] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="px-4 pb-4 pt-0">
              <p className="text-sm mb-2">{error.message}</p>
              
              {expandedErrors[error.id!] && (
                <div className="mt-2 space-y-2">
                  {error.record && (
                    <div>
                      <p className="text-xs font-medium mb-1">Record Data:</p>
                      <div className="bg-muted p-2 rounded-md overflow-x-auto">
                        <pre className="text-xs">
                          {JSON.stringify(error.record, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {error.resolved && error.resolution_notes && (
                    <div className="border-t border-gray-200 mt-3 pt-3">
                      <p className="text-xs font-medium mb-1">Resolution Notes:</p>
                      <p className="text-sm text-muted-foreground">{error.resolution_notes}</p>
                    </div>
                  )}
                  
                  {!error.resolved && onResolve && (
                    <div className="flex justify-end mt-3">
                      <Button
                        size="sm"
                        onClick={() => setIsResolvingError(error.id!)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Resolved
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
      
      <Dialog 
        open={!!isResolvingError} 
        onOpenChange={(open) => !open && setIsResolvingError(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Error</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="mb-2 text-sm">Add optional notes about how this error was resolved:</p>
            <Textarea
              placeholder="Resolution notes..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolvingError(null)}>
              Cancel
            </Button>
            <Button onClick={handleResolveError}>
              Mark as Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
