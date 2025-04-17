import React, { useState } from 'react';
import { GlSyncRecord } from '@/types/glide-sync/glsync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle, ExternalLink, RefreshCw, XCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface SyncErrorDisplayProps {
  syncErrors: GlSyncRecord[];
  onResolve?: (errorId: string, notes?: string) => Promise<boolean>;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function SyncErrorDisplay({ 
  syncErrors, 
  onResolve, 
  onRefresh,
  isLoading = false,
  className = "" 
}: SyncErrorDisplayProps) {
  const [selectedError, setSelectedError] = useState<GlSyncRecord | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleResolve = async () => {
    if (!selectedError || !onResolve) return;
    
    setIsResolving(true);
    try {
      const success = await onResolve(selectedError.id!, resolutionNotes);
      if (success) {
        setSelectedError(null);
        setResolutionNotes('');
      }
    } finally {
      setIsResolving(false);
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy h:mm a');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'VALIDATION_ERROR':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'TRANSFORM_ERROR':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'API_ERROR':
        return <ExternalLink className="h-4 w-4 text-blue-500" />;
      case 'RATE_LIMIT':
        return <RefreshCw className="h-4 w-4 text-purple-500" />;
      case 'NETWORK_ERROR':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getErrorTypeBadge = (type: string) => {
    switch (type) {
      case 'VALIDATION_ERROR':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Validation</Badge>;
      case 'TRANSFORM_ERROR':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Transform</Badge>;
      case 'API_ERROR':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">API</Badge>;
      case 'RATE_LIMIT':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Rate Limit</Badge>;
      case 'NETWORK_ERROR':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Network</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex justify-between items-center">
              <span>Sync Errors</span>
              <Skeleton className="h-9 w-24" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex p-3 border rounded-md">
                  <Skeleton className="h-4 w-4 mr-3 mt-1" />
                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-7 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Sync Errors {syncErrors.length > 0 && `(${syncErrors.length})`}</span>
            {onRefresh && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {syncErrors.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-muted-foreground">No sync errors found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {syncErrors.map(error => (
                <div key={error.id} className="flex p-3 border rounded-md hover:bg-slate-50">
                  <div className="mr-3 mt-1">
                    {getErrorIcon(error.type)}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between items-start">
                      <div className="font-medium">{error.message}</div>
                      {getErrorTypeBadge(error.type)}
                    </div>
                    {error.record && (
                      <div className="text-sm text-muted-foreground">
                        Record ID: {error.record.id || error.record.glide_row_id || 'Unknown'}
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-muted-foreground">
                        {formatTimestamp(error.timestamp)}
                      </div>
                      {onResolve && !error.resolved && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedError(error);
                                setResolutionNotes('');
                              }}
                            >
                              Resolve
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <VisuallyHidden>
                              <DialogTitle>Resolve Sync Error</DialogTitle>
                            </VisuallyHidden>
                            <DialogHeader>
                              <DialogDescription>
                                Mark this error as resolved and add optional resolution notes.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Error Message</Label>
                                <div className="p-2 bg-slate-50 rounded-md text-sm">
                                  {selectedError?.message}
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="resolution-notes">Resolution Notes (Optional)</Label>
                                <Textarea
                                  id="resolution-notes"
                                  value={resolutionNotes}
                                  onChange={(e) => setResolutionNotes(e.target.value)}
                                  placeholder="Add notes about how this error was resolved..."
                                  rows={4}
                                />
                              </div>
                            </div>
                            
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setSelectedError(null)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={handleResolve}
                                disabled={isResolving}
                              >
                                {isResolving ? (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Resolving...
                                  </>
                                ) : 'Mark as Resolved'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
