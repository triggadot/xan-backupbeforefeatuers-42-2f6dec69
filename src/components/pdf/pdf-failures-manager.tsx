import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, RefreshCw, Play } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Types and hooks
import { PDFGenerationFailure, DocumentType } from '@/types/pdf-generation';
import { usePDFFailures } from '@/hooks/usePDFFailures';

/**
 * Component to display and manage PDF generation failures
 */
export function PDFFailuresManager() {
  const {
    failures,
    isLoading,
    error,
    filter,
    setFilter,
    refetch,
    actions,
    status,
  } = usePDFFailures();

  const [selectedFailure, setSelectedFailure] = useState<PDFGenerationFailure | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Handle tab change for filtering between all, unresolved, and manual intervention
  const handleTabChange = (value: string) => {
    if (value === 'all') {
      setFilter({ ...filter, resolved: undefined });
    } else if (value === 'unresolved') {
      setFilter({ ...filter, resolved: false, requiresManualIntervention: undefined });
    } else if (value === 'manual') {
      setFilter({ ...filter, resolved: false, requiresManualIntervention: true });
    }
  };

  // Handle document type filter change
  const handleDocTypeChange = (value: string) => {
    if (value === 'all') {
      setFilter({ ...filter, documentType: undefined });
    } else {
      setFilter({ 
        ...filter, 
        documentType: value as DocumentType 
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Handle retry action
  const handleRetry = (id: number) => {
    actions.retry(id);
  };

  // Handle reset action
  const handleReset = (id: number) => {
    actions.reset(id);
  };

  // Handle resolve action
  const handleResolve = (id: number) => {
    actions.resolve(id);
  };

  // Handle batch retry action
  const handleBatchRetry = () => {
    actions.batchRetry();
  };

  // View failure details
  const viewDetails = (failure: PDFGenerationFailure) => {
    setSelectedFailure(failure);
    setDetailsOpen(true);
  };

  // Determine badge color based on retry count
  const getRetryBadgeColor = (retryCount: number) => {
    if (retryCount === 0) return 'bg-gray-100 text-gray-800';
    if (retryCount < 3) return 'bg-yellow-100 text-yellow-800';
    if (retryCount < 7) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  // Get document type display text
  const getDocumentTypeDisplay = (type: string) => {
    switch (type.toLowerCase()) {
      case 'invoice':
        return 'Invoice';
      case 'estimate':
        return 'Estimate';
      case 'purchase_order':
        return 'Purchase Order';
      default:
        return type;
    }
  };

  // Render error state
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load PDF generation failures: {error instanceof Error ? error.message : 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">PDF Generation Failures</CardTitle>
        <CardDescription>
          Manage PDF generation failures and retry operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Tabs defaultValue="unresolved" onValueChange={handleTabChange} className="w-[400px]">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unresolved">Unresolved</TabsTrigger>
              <TabsTrigger value="manual">Manual Intervention</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Select onValueChange={handleDocTypeChange} defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                <SelectItem value="invoice">Invoices</SelectItem>
                <SelectItem value="estimate">Estimates</SelectItem>
                <SelectItem value="purchase_order">Purchase Orders</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleBatchRetry}
              disabled={status.isBatchRetrying}
            >
              <Play className="h-4 w-4 mr-1" />
              Process Retries
            </Button>
          </div>
        </div>

        {status.isBatchRetrying && (
          <Alert className="mb-4">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertTitle>Processing</AlertTitle>
            <AlertDescription>
              Batch retry is in progress. This may take a few moments.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="w-full h-16" />
            ))}
          </div>
        ) : failures && failures.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>Last Attempt</TableHead>
                  <TableHead>Next Attempt</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failures.map((failure) => (
                  <TableRow key={failure.id}>
                    <TableCell className="font-medium">{failure.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{getDocumentTypeDisplay(failure.document_type)}</span>
                        <span className="text-sm text-gray-500 truncate max-w-[100px]">
                          {failure.document_id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div 
                        className="text-sm text-gray-500 truncate max-w-[200px] cursor-pointer hover:text-blue-500"
                        onClick={() => viewDetails(failure)}
                      >
                        {failure.error_message || 'Unknown error'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRetryBadgeColor(failure.retry_count)}>
                        {failure.retry_count}
                      </Badge>
                      {failure.requires_manual_intervention && (
                        <Badge variant="destructive" className="ml-1">
                          Manual
                        </Badge>
                      )}
                      {failure.resolved && (
                        <Badge variant="outline" className="ml-1 bg-green-100">
                          Resolved
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(failure.last_attempt)}</TableCell>
                    <TableCell>{formatDate(failure.next_attempt)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewDetails(failure)}
                        >
                          Details
                        </Button>
                        {!failure.resolved && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleRetry(failure.id)}
                              disabled={status.isRetrying}
                            >
                              Retry
                            </Button>
                            {failure.requires_manual_intervention && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReset(failure.id)}
                                disabled={status.isResetting}
                              >
                                Reset
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResolve(failure.id)}
                              disabled={status.isResolving}
                            >
                              Mark Resolved
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
            <h3 className="text-xl font-semibold">No failures found</h3>
            <p className="text-gray-500 mt-1">
              {filter.resolved === false
                ? 'There are no unresolved PDF generation failures.'
                : 'All PDF generations have been successful.'}
            </p>
          </div>
        )}
      </CardContent>
      
      {/* Failure Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>PDF Generation Failure Details</DialogTitle>
            <DialogDescription>
              Detailed information about the failed PDF generation
            </DialogDescription>
          </DialogHeader>

          {selectedFailure && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Document Type</h4>
                  <p className="text-sm">{getDocumentTypeDisplay(selectedFailure.document_type)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Document ID</h4>
                  <p className="text-sm font-mono">{selectedFailure.document_id}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Retry Count</h4>
                  <p className="text-sm">{selectedFailure.retry_count}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Status</h4>
                  <p className="text-sm">
                    {selectedFailure.resolved 
                      ? 'Resolved' 
                      : selectedFailure.requires_manual_intervention 
                        ? 'Requires Manual Intervention' 
                        : 'Pending Retry'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">First Attempt</h4>
                  <p className="text-sm">{formatDate(selectedFailure.first_attempt)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Last Attempt</h4>
                  <p className="text-sm">{formatDate(selectedFailure.last_attempt)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Next Scheduled Attempt</h4>
                  <p className="text-sm">{formatDate(selectedFailure.next_attempt)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Created</h4>
                  <p className="text-sm">{formatDate(selectedFailure.created_at)}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Error Message</h4>
                <div className="p-3 bg-gray-50 rounded-md text-sm font-mono whitespace-pre-wrap text-red-600">
                  {selectedFailure.error_message || 'No error message provided'}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedFailure && !selectedFailure.resolved && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleReset(selectedFailure.id)}
                  disabled={status.isResetting}
                >
                  Reset Counter
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleRetry(selectedFailure.id)}
                  disabled={status.isRetrying}
                >
                  Retry Now
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleResolve(selectedFailure.id);
                    setDetailsOpen(false);
                  }}
                  disabled={status.isResolving}
                >
                  Mark as Resolved
                </Button>
              </>
            )}
            <Button
              variant={selectedFailure?.resolved ? 'default' : 'secondary'}
              onClick={() => setDetailsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default PDFFailuresManager;
