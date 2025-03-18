
import React, { useState } from 'react';
import { GlSyncRecord } from '@/types/glsync';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SyncErrorDisplayProps {
  syncErrors: GlSyncRecord[];
  onResolve?: (errorId: string, notes?: string) => Promise<boolean>;
  onRefresh?: (includeResolved?: boolean) => Promise<void>;
  className?: string;
}

export function SyncErrorDisplay({ syncErrors, onResolve, onRefresh, className }: SyncErrorDisplayProps) {
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState<Record<string, boolean>>({});
  const [showResolved, setShowResolved] = useState(false);

  const handleResolve = async (errorId: string) => {
    if (!onResolve) return;
    
    setResolving(prev => ({ ...prev, [errorId]: true }));
    
    try {
      const success = await onResolve(errorId, resolutionNotes[errorId]);
      
      if (success) {
        setResolutionNotes(prev => {
          const newNotes = { ...prev };
          delete newNotes[errorId];
          return newNotes;
        });
        
        if (onRefresh) {
          await onRefresh(showResolved);
        }
      }
    } catch (error) {
      console.error('Error resolving sync error:', error);
    } finally {
      setResolving(prev => ({ ...prev, [errorId]: false }));
    }
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh(showResolved);
    }
  };

  const handleShowResolvedToggle = async (checked: boolean) => {
    setShowResolved(checked);
    if (onRefresh) {
      await onRefresh(checked);
    }
  };

  const getErrorBadgeColor = (type: string) => {
    switch (type) {
      case 'VALIDATION_ERROR':
        return 'bg-yellow-500';
      case 'API_ERROR':
        return 'bg-red-500';
      case 'RATE_LIMIT':
        return 'bg-orange-500';
      case 'NETWORK_ERROR':
        return 'bg-purple-500';
      case 'TRANSFORM_ERROR':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  const errorTypes = {
    'VALIDATION_ERROR': 'Data validation failed',
    'API_ERROR': 'API communication error',
    'RATE_LIMIT': 'Rate limit exceeded',
    'NETWORK_ERROR': 'Network connectivity issue',
    'TRANSFORM_ERROR': 'Data transformation error'
  };

  if (syncErrors.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg">Sync Errors</CardTitle>
            <CardDescription>No errors found for this sync mapping</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
            <span>All clear! No sync errors detected.</span>
          </div>
        </CardContent>
        <CardFooter className="border-t p-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="show-resolved" 
              checked={showResolved}
              onCheckedChange={handleShowResolvedToggle}
            />
            <Label htmlFor="show-resolved">Show resolved errors</Label>
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg">Sync Errors</CardTitle>
          <CardDescription>
            {syncErrors.length} error{syncErrors.length !== 1 ? 's' : ''} found during sync operations
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="multiple" className="w-full">
          {syncErrors.map((error, index) => (
            <AccordionItem key={error.id || index} value={error.id || `error-${index}`} className="border-b">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex justify-between items-center w-full pr-4">
                  <div className="flex items-center gap-2">
                    {error.resolved ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    <Badge className={cn("text-white", getErrorBadgeColor(error.type))}>
                      {error.type}
                    </Badge>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(error.timestamp).toLocaleString()}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Error Type:</h4>
                    <p className="text-sm mb-3 p-2 bg-muted rounded">
                      {errorTypes[error.type as keyof typeof errorTypes] || error.type}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Error Message:</h4>
                    <p className="text-sm mb-3 p-2 bg-muted rounded">{error.message}</p>
                  </div>
                  
                  {error.record && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Affected Record:</h4>
                      <pre className="text-xs p-2 bg-slate-100 dark:bg-slate-900 rounded overflow-x-auto max-h-40">
                        {JSON.stringify(error.record, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {error.retryable && !error.resolved && (
                    <div className="flex items-center">
                      <Badge variant="outline" className="border-blue-400 text-blue-500">
                        This error can be retried automatically
                      </Badge>
                    </div>
                  )}
                  
                  {onResolve && !error.resolved && (
                    <div className="mt-4 space-y-2">
                      <Textarea 
                        placeholder="Add resolution notes (optional)" 
                        value={resolutionNotes[error.id || ''] || ''}
                        onChange={(e) => setResolutionNotes(prev => ({ 
                          ...prev, 
                          [error.id || '']: e.target.value 
                        }))}
                        className="text-sm"
                        rows={2}
                      />
                      <Button 
                        variant="default" 
                        size="sm"
                        className="w-full"
                        onClick={() => handleResolve(error.id || '')}
                        disabled={resolving[error.id || '']}
                      >
                        {resolving[error.id || ''] ? 'Resolving...' : 'Mark as Resolved'}
                      </Button>
                    </div>
                  )}
                  
                  {error.resolved && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                      <div className="flex items-center text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        <span className="font-medium">Resolved</span>
                      </div>
                      {error.resolution_notes && (
                        <p className="mt-1 text-muted-foreground">{error.resolution_notes}</p>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
      <CardFooter className="justify-between flex-col sm:flex-row items-center gap-2 border-t p-4">
        <div className="flex items-center space-x-2">
          <Switch 
            id="show-resolved" 
            checked={showResolved}
            onCheckedChange={handleShowResolvedToggle}
          />
          <Label htmlFor="show-resolved">Show resolved errors</Label>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Displaying {syncErrors.length} error record{syncErrors.length !== 1 ? 's' : ''}
        </p>
      </CardFooter>
    </Card>
  );
}
