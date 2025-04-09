import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon, PencilIcon, DownloadIcon, ShareIcon, RefreshCw, Trash2, FileTextIcon } from 'lucide-react'; // Added FileTextIcon
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/utils/use-toast';
import { supabase } from '@/integrations/supabase/client'; // Import supabase client
import { Button } from '@/components/ui/button'; // Import Button component
import { format } from 'date-fns';
import { PurchaseOrder } from '@/types/purchaseOrder';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface PurchaseOrderListProps {
  purchaseOrders: PurchaseOrder[];
  isLoading: boolean;
  onViewPurchaseOrder?: (purchaseOrder: PurchaseOrder) => void;
  onDelete?: (id: string) => void;
}

const PurchaseOrderList = ({ 
  purchaseOrders, 
  isLoading,
  onViewPurchaseOrder,
  onDelete
}: PurchaseOrderListProps) => {
  const { toast } = useToast();
  const [selectedPurchaseOrders, setSelectedPurchaseOrders] = useState<string[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false); // State for batch processing
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPurchaseOrders(purchaseOrders.map(po => po.id));
    } else {
      setSelectedPurchaseOrders([]);
    }
  };

  const handleSelectPurchaseOrder = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedPurchaseOrders(prev => [...prev, id]);
    } else {
      setSelectedPurchaseOrders(prev => prev.filter(poId => poId !== id));
    }
  };

  const handleDownloadPdf = (id: string) => {
    toast({
      title: 'Download started',
      description: 'Your purchase order PDF is being prepared for download.',
    });
  };

  const handleSharePurchaseOrder = (id: string) => {
    toast({
      title: 'Share options',
      description: 'Purchase order sharing options will be available soon.',
    });
  };

  // --- Batch PDF Generation Handler ---
  const handleBatchGeneratePdfs = async () => {
    if (selectedPurchaseOrders.length === 0 || isBatchProcessing) {
      return;
    }

    setIsBatchProcessing(true);
    const processingToast = toast({
      title: 'Batch PDF Generation Started',
      description: `Processing ${selectedPurchaseOrders.length} purchase order(s)... Please wait.`,
      duration: 999999, // Keep toast open until dismissed
    });

    const itemsToProcess = selectedPurchaseOrders.map(id => ({ id, type: 'purchaseOrder' })); // Set type to 'purchaseOrder'

    try {
      const { data, error } = await supabase.functions.invoke('batch-generate-and-store-pdfs', {
        body: JSON.stringify({ items: itemsToProcess }),
      });

      processingToast.dismiss(); // Dismiss loading toast

      if (error) {
        throw error;
      }

      // Process results from the function
      type BatchResultItem = { id: string; type: string; success: boolean; url?: string; error?: string };
      const results: BatchResultItem[] = data?.results || [];
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      toast({
        title: 'Batch PDF Generation Complete',
        description: `Successfully generated ${successCount} PDF(s). ${failureCount > 0 ? `${failureCount} failed.` : ''}`,
        variant: failureCount > 0 ? 'warning' : 'default',
        duration: 5000,
      });

      if (failureCount > 0) {
        console.error('Batch PDF Generation Failures:', results.filter((r) => !r.success));
      }
      
      // Clear selection after processing
      setSelectedPurchaseOrders([]); 

    } catch (error) {
      console.error('Error calling batch-generate-and-store-pdfs function:', error);
      processingToast.dismiss(); // Dismiss loading toast on error too
      toast({
        title: 'Batch PDF Generation Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsBatchProcessing(false);
    }
  };
  // --- End Batch PDF Generation Handler ---

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'secondary';
      case 'sent':
        return 'default';
      case 'partial':
        return 'warning';
      case 'paid':
      case 'complete':
        return 'success';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-60">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!purchaseOrders || purchaseOrders.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">No Purchase Orders</h2>
          <p className="text-muted-foreground">You haven't created any purchase orders yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {/* Add Batch Action Button */}
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Purchase Orders</CardTitle> 
        <Button
          onClick={handleBatchGeneratePdfs}
          disabled={selectedPurchaseOrders.length === 0 || isBatchProcessing}
          size="sm"
        >
          <FileTextIcon className="mr-2 h-4 w-4" />
          {isBatchProcessing ? 'Processing...' : `Generate ${selectedPurchaseOrders.length} PDF(s)`}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedPurchaseOrders.length === purchaseOrders.length && purchaseOrders.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Purchase Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((purchaseOrder) => (
                <TableRow key={purchaseOrder.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedPurchaseOrders.includes(purchaseOrder.id)}
                      onCheckedChange={(checked) => handleSelectPurchaseOrder(purchaseOrder.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link to={`/purchase-orders/${purchaseOrder.id}`} className="hover:underline">
                      <div className="font-medium">{purchaseOrder.number || `PO-${purchaseOrder.id.slice(0, 8)}`}</div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link to={`/purchase-orders/${purchaseOrder.id}`} className="text-gray-700 hover:text-gray-900">
                      {purchaseOrder.date ? format(new Date(purchaseOrder.date), 'MMM dd, yyyy') : 'N/A'}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link to={`/purchase-orders/${purchaseOrder.id}`} className="text-gray-700 hover:text-gray-900">
                      {purchaseOrder.vendorName || (purchaseOrder.vendor?.account_name || 'N/A')}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(purchaseOrder.status)}>
                      {purchaseOrder.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(purchaseOrder.total_amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Link to={`/purchase-orders/${purchaseOrder.id}`} className="text-blue-600 hover:text-blue-700">
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <Link to={`/purchase-orders/${purchaseOrder.id}/edit`} className="text-gray-600 hover:text-gray-700">
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(purchaseOrder.id)}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSharePurchaseOrder(purchaseOrder.id)}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <ShareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete?.(purchaseOrder.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchaseOrderList;
