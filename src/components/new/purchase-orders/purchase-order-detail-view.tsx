import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Printer, Download, Share2, Edit, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PurchaseOrder, PurchaseOrderLineItem } from '@/types/purchaseOrder';

interface PurchaseOrderDetailViewProps {
  purchaseOrder: PurchaseOrder;
  isLoading: boolean;
  onRefresh?: () => void;
}

const PurchaseOrderDetailView = ({
  purchaseOrder,
  isLoading,
  onRefresh,
}: PurchaseOrderDetailViewProps) => {
  const navigate = useNavigate();

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

  const handleGoBack = () => {
    navigate('/purchase-orders');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implement download functionality
    console.log('Download purchase order:', purchaseOrder.id);
  };

  const handleShare = () => {
    // Implement share functionality
    console.log('Share purchase order:', purchaseOrder.id);
  };

  const handleEdit = () => {
    navigate(`/purchase-orders/${purchaseOrder.id}/edit`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-60">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={handleGoBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Purchase Orders
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Purchase Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {purchaseOrder.number || `PO-${purchaseOrder.id.slice(0, 8)}`}
                  </h2>
                  <Badge variant={getStatusBadgeVariant(purchaseOrder.status)} className="mt-1">
                    {purchaseOrder.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div>
                    {purchaseOrder.date
                      ? format(new Date(purchaseOrder.date), 'MMM dd, yyyy')
                      : 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Vendor</div>
                <div className="font-medium">
                  {purchaseOrder.vendorName || (purchaseOrder.vendor?.account_name || 'N/A')}
                </div>
              </div>

              {purchaseOrder.notes && (
                <div>
                  <div className="text-sm text-muted-foreground">Notes</div>
                  <div className="text-sm">{purchaseOrder.notes}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <div>Subtotal</div>
                <div>{formatCurrency(purchaseOrder.total_amount)}</div>
              </div>
              <div className="flex justify-between">
                <div>Amount Paid</div>
                <div>{formatCurrency(purchaseOrder.total_paid || 0)}</div>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <div>Balance Due</div>
                <div>{formatCurrency(purchaseOrder.balance || 0)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Item</th>
                  <th className="text-right py-2 px-4">Quantity</th>
                  <th className="text-right py-2 px-4">Unit Price</th>
                  <th className="text-right py-2 px-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrder.lineItems && purchaseOrder.lineItems.length > 0 ? (
                  purchaseOrder.lineItems.map((item, index) => (
                    <tr key={item.id || index} className="border-b">
                      <td className="py-2 px-4">
                        <div className="font-medium">
                          {item.productDetails?.product_name_display || 
                            item.product_name || 
                            item.description || 
                            'Unnamed Product'}
                        </div>
                        {item.notes && <div className="text-sm text-muted-foreground">{item.notes}</div>}
                      </td>
                      <td className="text-right py-2 px-4">{item.quantity}</td>
                      <td className="text-right py-2 px-4">
                        {formatCurrency(item.unitPrice || item.unit_price || 0)}
                      </td>
                      <td className="text-right py-2 px-4">{formatCurrency(item.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted-foreground">
                      No line items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {purchaseOrder.vendorPayments && purchaseOrder.vendorPayments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Date</th>
                    <th className="text-left py-2 px-4">Method</th>
                    <th className="text-left py-2 px-4">Notes</th>
                    <th className="text-right py-2 px-4">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrder.vendorPayments.map((payment, index) => (
                    <tr key={payment.id || index} className="border-b">
                      <td className="py-2 px-4">
                        {payment.date ? format(new Date(payment.date), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="py-2 px-4">{payment.method || 'N/A'}</td>
                      <td className="py-2 px-4">{payment.notes || '-'}</td>
                      <td className="text-right py-2 px-4">{formatCurrency(payment.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 mt-6">
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderDetailView;
