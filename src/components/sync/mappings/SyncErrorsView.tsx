
import React, { useState } from 'react';
import { GlSyncRecord } from '@/types/glsync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface SyncErrorsViewProps {
  syncErrors: GlSyncRecord[];
  onResolve: (errorId: string, notes?: string) => Promise<boolean>;
  onRefresh?: () => void;
  onToggleShowResolved?: (include: boolean) => void;
  includeResolved?: boolean;
  isLoading?: boolean;
}

export function SyncErrorsView({ 
  syncErrors, 
  onResolve,
  onRefresh,
  onToggleShowResolved,
  includeResolved = false,
  isLoading = false
}: SyncErrorsViewProps) {
  const [selectedError, setSelectedError] = useState<GlSyncRecord | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = async () => {
    if (!selectedError) return;
    
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Sync Errors</CardTitle>
        <div className="flex items-center gap-4">
          {onToggleShowResolved && (
            <div className="flex items-center space-x-2">
              <Switch 
                id="show-resolved" 
                checked={includeResolved}
                onCheckedChange={(checked) => onToggleShowResolved(checked)}
              />
              <Label htmlFor="show-resolved">Show Resolved</Label>
            </div>
          )}
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 border rounded animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : syncErrors.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No synchronization errors found
          </div>
        ) : (
          <div className="space-y-4">
            {syncErrors.map((error) => (
              <div 
                key={error.id} 
                className={`p-4 border rounded ${error.resolved ? 'bg-muted/30' : 'hover:bg-muted/10'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    {error.resolved ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <span className="font-medium">
                      {error.error_type || error.type}
                    </span>
                  </div>
                  <Badge variant={error.retryable ? "outline" : "secondary"}>
                    {error.retryable ? "Retryable" : "Non-retryable"}
                  </Badge>
                </div>
                <p className="text-sm mb-2">{error.error_message || error.message}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {formatDistanceToNow(new Date(error.timestamp || error.created_at!), { addSuffix: true })}
                  </span>
                  {!error.resolved && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedError(error)}
                        >
                          Resolve
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Resolve Sync Error</DialogTitle>
                          <DialogDescription>
                            Provide optional notes about how this error was resolved.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Label htmlFor="resolution-notes">Resolution Notes</Label>
                          <Textarea
                            id="resolution-notes"
                            placeholder="Describe how the error was resolved..."
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            className="mt-2"
                          />
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setSelectedError(null);
                              setResolutionNotes('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleResolve}
                            disabled={isResolving}
                          >
                            {isResolving ? 'Resolving...' : 'Mark as Resolved'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  {error.resolved && error.resolution_notes && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">View Resolution</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Resolution Notes</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <p>{error.resolution_notes}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Resolved {error.resolved_at ? formatDistanceToNow(new Date(error.resolved_at), { addSuffix: true }) : ''}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
