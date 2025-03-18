
import { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatRelative } from 'date-fns';
import { GlSyncRecord } from '@/types/glsync';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncErrorsViewProps {
  errors?: GlSyncRecord[];
  syncErrors?: GlSyncRecord[];
  onRefresh?: () => void;
  onResolve?: (errorId: string, notes?: string) => Promise<boolean>;
  mappingId?: string;
}

export function SyncErrorsView({ errors, syncErrors, onRefresh, onResolve, mappingId }: SyncErrorsViewProps) {
  const [loading, setLoading] = useState(false);
  const [selectedError, setSelectedError] = useState<GlSyncRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [localErrors, setLocalErrors] = useState<GlSyncRecord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (syncErrors) {
      setLocalErrors(syncErrors);
    } else if (errors) {
      setLocalErrors(errors);
    } else if (mappingId) {
      fetchErrors();
    }
  }, [syncErrors, errors, mappingId]);

  const fetchErrors = async () => {
    if (!mappingId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('gl_get_sync_errors', { p_mapping_id: mappingId });
      
      if (error) throw new Error(error.message);
      
      const formattedErrors: GlSyncRecord[] = (data || []).map((error: any) => ({
        id: error.id,
        mapping_id: error.mapping_id,
        type: error.error_type as 'VALIDATION_ERROR' | 'TRANSFORM_ERROR' | 'API_ERROR' | 'RATE_LIMIT' | 'NETWORK_ERROR',
        message: error.error_message,
        record: error.record_data,
        timestamp: error.created_at,
        retryable: error.retryable,
        resolved: !!error.resolved_at,
        resolution_notes: error.resolution_notes,
        created_at: error.created_at,
        error_type: error.error_type,
        error_message: error.error_message,
        record_data: error.record_data,
        resolved_at: error.resolved_at
      }));
      
      setLocalErrors(formattedErrors);
    } catch (error) {
      console.error('Error fetching sync errors:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch synchronization errors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    if (onRefresh) {
      await onRefresh();
    } else {
      await fetchErrors();
    }
    setLoading(false);
  };

  const handleResolveClick = (error: GlSyncRecord) => {
    setSelectedError(error);
    setResolutionNotes('');
    setIsDialogOpen(true);
  };

  const handleResolve = async () => {
    if (!selectedError) return;
    
    const resolveFunction = onResolve || (async (errorId: string, notes?: string) => {
      try {
        const { data, error } = await supabase
          .rpc('gl_resolve_sync_error', { 
            p_error_id: errorId,
            p_resolution_notes: notes || null
          });
        
        if (error) throw new Error(error.message);
        
        // Refresh errors after resolution
        await fetchErrors();
        
        toast({
          title: 'Error resolved',
          description: 'The error has been marked as resolved',
        });
        
        return true;
      } catch (error) {
        console.error('Error resolving sync error:', error);
        toast({
          title: 'Error',
          description: 'Failed to resolve the error',
          variant: 'destructive',
        });
        return false;
      }
    });
    
    setIsResolving(true);
    try {
      const success = await resolveFunction(selectedError.id!, resolutionNotes);
      if (success) {
        setIsDialogOpen(false);
        handleRefresh();
      }
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {localErrors.length > 0 && (
            <div className="flex items-center text-destructive">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span>{localErrors.length} unresolved error{localErrors.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Retryable</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localErrors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No sync errors found. That's great!
                  </TableCell>
                </TableRow>
              ) : (
                localErrors.map((error) => {
                  const timestamp = new Date(error.timestamp);
                  
                  return (
                    <TableRow key={error.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatRelative(timestamp, new Date())}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {error.type.replace(/_/g, ' ').toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[400px] truncate">{error.message}</TableCell>
                      <TableCell>
                        {error.retryable ? (
                          <Badge variant="secondary">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {(onResolve || mappingId) && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleResolveClick(error)}
                          >
                            Resolve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Error</DialogTitle>
            <DialogDescription>
              Add optional notes explaining how this error was resolved.
            </DialogDescription>
          </DialogHeader>
          
          {selectedError && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Error Message</h4>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm">{selectedError.message}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Resolution Notes (Optional)</h4>
                <Textarea
                  placeholder="Explain how you resolved this issue..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={isResolving}>
              {isResolving ? 'Resolving...' : 'Mark as Resolved'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
