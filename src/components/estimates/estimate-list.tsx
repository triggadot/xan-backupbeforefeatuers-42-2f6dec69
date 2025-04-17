import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { EstimateWithDetails } from '@/types/estimates/estimate';
import { Eye, FileText, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface EstimateListProps {
  estimates: EstimateWithDetails[];
  isLoading: boolean;
  onViewEstimate: (estimate: EstimateWithDetails) => void;
  onDelete: (id: string) => void;
  onConvertToInvoice: (id: string) => void;
}

export function EstimateList({
  estimates,
  isLoading,
  onViewEstimate,
  onDelete,
  onConvertToInvoice,
}: EstimateListProps) {
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'converted':
        return <Badge variant="success">Converted</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'draft':
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <div className="px-4 py-3 border-b">
          <Skeleton className="h-6 w-1/4" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-6 w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {estimates.length > 0 ? (
            estimates.map((estimate) => (
              <TableRow key={estimate.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">EST-{estimate.id.substring(0, 8)}</TableCell>
                <TableCell>{estimate.account?.account_name || 'Unknown'}</TableCell>
                <TableCell>{formatDate(estimate.estimate_date || estimate.created_at)}</TableCell>
                <TableCell>{getStatusBadge(estimate.status)}</TableCell>
                <TableCell className="text-right">{formatCurrency(estimate.total_amount)}</TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewEstimate(estimate)}
                      title="View estimate"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {estimate.status !== 'converted' && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onConvertToInvoice(estimate.id)}
                          title="Convert to invoice"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this estimate?')) {
                              onDelete(estimate.id);
                            }
                          }}
                          title="Delete estimate"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                No estimates found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 