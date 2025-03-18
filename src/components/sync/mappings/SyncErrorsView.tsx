
import { useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatRelative } from 'date-fns';
import { GlSyncRecord } from '@/types/glsync';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface SyncErrorsViewProps {
  errors: GlSyncRecord[];
  onRefresh: () => void;
  onResolve?: (errorId: string, notes?: string) => Promise<boolean>;
}

export function SyncErrorsView({ errors, onRefresh, onResolve }: SyncErrorsViewProps) {
  const [loading, setLoading] = useState(false);
  const [selectedError, setSelectedError] = useState<GlSyncRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await onRefresh();
    setLoading(false);
  };

  const handleResolveClick = (error: GlSyncRecord) => {
    setSelectedError(error);
    setResolutionNotes('');
    setIsDialogOpen(true);
  };

  const handleResolve = async () => {
    if (!selectedError || !onResolve) return;
    
    setIsResolving(true);
    try {
      const success = await onResolve(selectedError.id!, resolutionNotes);
      if (success) {
        setIsDialogOpen(false);
        onRefresh();
      }
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {errors.length > 0 && (
            <div className="flex items-center text-destructive">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span>{errors.length} unresolved error{errors.length !== 1 ? 's' : ''}</span>
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
              {errors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No sync errors found. That's great!
                  </TableCell>
                </TableRow>
              ) : (
                errors.map((error) => {
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
                        {onResolve && (
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
      
      {onResolve && (
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
      )}
    </div>
  );
}
