import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon, PencilIcon, DownloadIcon, ShareIcon, Trash2, FileTextIcon, MoreHorizontal } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/utils/use-toast';
import { PurchaseOrder } from '@/types/purchase-orders/purchaseOrder';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { usePDF } from '@/hooks/pdf/usePDF';
import { DocumentType } from '@/types/documents/pdf.unified';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from '@/hooks/utils/use-mobile';

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
  const isMobile = useIsMobile();
  const [selectedPurchaseOrders, setSelectedPurchaseOrders] = useState<string[]>([]);
  const { batchGenerateMultiplePDFs, generatePDF, downloadPDF, isGenerating, isBatchGenerating } = usePDF();
  const isBatchProcessing = isGenerating || isBatchGenerating;

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

  const handleDownloadPdf = async (id: string) => {
    try {
      toast({
        title: 'Download Started',
        description: 'Your purchase order PDF is being prepared for download.',
      });
      
      // Generate the PDF and get the URL
      const result = await generatePDF(DocumentType.PURCHASE_ORDER, id, { download: true });
      
      if (!result || !result.success || !result.url) {
        throw new Error('Failed to generate PDF');
      }
      
      toast({
        title: 'Download Complete',
        description: 'Your purchase order PDF has been downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'There was an error generating the PDF.',
        variant: 'destructive',
      });
    }
  };

  const handleSharePurchaseOrder = (id: string) => {
    toast({
      title: 'Share options',
      description: 'Purchase order sharing options will be available soon.',
    });
  };

  const handleBatchGeneratePdfs = async () => {
    if (selectedPurchaseOrders.length === 0 || isBatchProcessing) {
      return;
    }

    const processingToast = toast({
      title: 'Batch PDF Generation Started',
      description: `Processing ${selectedPurchaseOrders.length} purchase order(s)... Please wait.`,
      duration: 999999, // Keep toast open until dismissed
    });

    try {
      // Process all purchase orders in a single batch request using the new pdf-backend function
      const { success: successCount, failed: failureCount } = await batchGenerateMultiplePDFs(
        DocumentType.PURCHASE_ORDER, 
        selectedPurchaseOrders
      );

      processingToast.dismiss();

      toast({
        title: 'Batch PDF Generation Complete',
        description: `Successfully generated ${successCount} PDF(s). ${failureCount > 0 ? `${failureCount} failed.` : ''}`,
        variant: failureCount > 0 ? 'destructive' : 'default',
        duration: 5000,
      });

      // Clear selection after processing
      setSelectedPurchaseOrders([]);
    } catch (error) {
      console.error('Error during batch PDF generation:', error);
      processingToast.dismiss();
      toast({
        title: 'Batch PDF Generation Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

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

  // Mobile card view for purchase orders
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {selectedPurchaseOrders.length > 0 ? 
              `${selectedPurchaseOrders.length} selected` : 
              `${purchaseOrders.length} purchase orders`
            }
          </div>
          {selectedPurchaseOrders.length > 0 && (
            <Button
              onClick={handleBatchGeneratePdfs}
              disabled={isBatchProcessing}
              size="sm"
              variant="secondary"
            >
              <FileTextIcon className="mr-2 h-4 w-4" />
              {isBatchProcessing ? 'Processing...' : `Generate PDFs`}
            </Button>
          )}
        </div>
        
        <div className="space-y-3">
          {purchaseOrders.map((purchaseOrder) => (
            <Card key={purchaseOrder.id} className="overflow-hidden">
              <div className="flex items-start p-4">
                <Checkbox 
                  checked={selectedPurchaseOrders.includes(purchaseOrder.id)}
                  onCheckedChange={(checked) => handleSelectPurchaseOrder(purchaseOrder.id, !!checked)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1 min-w-0" onClick={() => onViewPurchaseOrder?.(purchaseOrder)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold truncate">
                        {purchaseOrder.number || `PO-${purchaseOrder.id.slice(0, 8)}`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {purchaseOrder.date ? formatDate(purchaseOrder.date) : 'N/A'}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(purchaseOrder.status)}>
                      {purchaseOrder.status}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium">{purchaseOrder.vendorName || (purchaseOrder.vendor?.account_name || 'N/A')}</p>
                    <p className="font-bold mt-1">{formatCurrency(purchaseOrder.total_amount)}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex border-t divide-x">
                <Link 
                  to={`/purchase-orders/${purchaseOrder.id}`} 
                  className="flex-1 p-3 text-center text-sm font-medium hover:bg-muted"
                >
                  <EyeIcon className="h-4 w-4 mx-auto mb-1" />
                  View
                </Link>
                <Link 
                  to={`/purchase-orders/${purchaseOrder.id}/edit`}
                  className="flex-1 p-3 text-center text-sm font-medium hover:bg-muted"
                >
                  <PencilIcon className="h-4 w-4 mx-auto mb-1" />
                  Edit
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex-1 p-3 text-center text-sm font-medium hover:bg-muted">
                      <MoreHorizontal className="h-4 w-4 mx-auto mb-1" />
                      More
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleDownloadPdf(purchaseOrder.id)}>
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSharePurchaseOrder(purchaseOrder.id)}>
                      <ShareIcon className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete?.(purchaseOrder.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Desktop table view
  return (
    <Card>
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
                    checked={selectedPurchaseOrders.length === purchaseOrders.length}
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
                      {purchaseOrder.date ? formatDate(purchaseOrder.date) : 'N/A'}
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
