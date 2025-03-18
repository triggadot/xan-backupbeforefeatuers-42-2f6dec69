
import React from 'react';
import { GlSyncRecord } from '@/types/glsync';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, AlertCircle } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

export interface SyncErrorsViewProps {
  syncErrors: GlSyncRecord[];
  onResolve?: (errorId: string, notes?: string) => Promise<boolean>;
}

export function SyncErrorsView({ syncErrors, onResolve }: SyncErrorsViewProps) {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  
  const handleResolve = async () => {
    if (!selectedErrorId || !onResolve) return;
    
    setIsResolving(true);
    try {
      await onResolve(selectedErrorId, resolutionNotes);
      setResolutionNotes('');
      setSelectedErrorId(null);
    } finally {
      setIsResolving(false);
    }
  };
  
  if (syncErrors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sync Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4">
            <p className="text-muted-foreground">No sync errors found</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
          Sync Errors ({syncErrors.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {syncErrors.map((error) => (
              <TableRow key={error.id}>
                <TableCell>
                  <Badge variant={error.type === 'VALIDATION_ERROR' ? 'destructive' : 'outline'}>
                    {error.type}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-md truncate">{error.message}</TableCell>
                <TableCell>{new Date(error.timestamp).toLocaleString()}</TableCell>
                <TableCell>
                  {onResolve && error.id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedErrorId(error.id)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Resolve
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Resolve Error</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to mark this error as resolved?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Textarea
                          placeholder="Optional resolution notes"
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          className="my-4"
                        />
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => {
                            setSelectedErrorId(null);
                            setResolutionNotes('');
                          }}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={(e) => {
                              e.preventDefault();
                              handleResolve();
                            }}
                            disabled={isResolving}
                          >
                            {isResolving ? 'Resolving...' : 'Resolve'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
