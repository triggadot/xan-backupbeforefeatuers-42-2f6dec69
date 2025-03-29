import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Calendar, DollarSign, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { formatCurrency } from '@/utils/format-utils';
import { format } from 'date-fns';

type StatusBadgeProps = {
  status: string;
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  
  switch (status?.toLowerCase()) {
    case 'paid':
      variant = "default";
      break;
    case 'partial':
      variant = "secondary";
      break;
    case 'unpaid':
      variant = "destructive";
      break;
    default:
      variant = "outline";
  }
  
  return <Badge variant={variant}>{status || 'Unknown'}</Badge>;
};

const PurchaseOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getPurchaseOrder } = usePurchaseOrders();
  const [purchaseOrder, setPurchaseOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const order = await getPurchaseOrder(id);
        setPurchaseOrder(order);
      } catch (err) {
        console.error("Error fetching purchase order:", err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching purchase order'));
        toast({
          title: "Error",
          description: "Failed to load purchase order details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrder();
  }, [id, getPurchaseOrder, toast]);

  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/4 mb-2" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-xl font-medium mb-2">Failed to load purchase order</h2>
            <p className="text-muted-foreground mb-6">{error && error.message}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-xl font-medium mb-2">Purchase Order Not Found</h2>
            <p className="text-muted-foreground mb-6">The requested purchase order doesn't exist or has been deleted.</p>
            <Button onClick={() => navigate('/purchase-orders')}>View All Purchase Orders</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">
              Purchase Order: {purchaseOrder.purchase_order_uid || purchaseOrder.id}
            </CardTitle>
            <p className="text-muted-foreground mt-1">
              Status: <StatusBadge status={purchaseOrder.payment_status} />
            </p>
          </div>
          <div className="flex gap-2">
            {purchaseOrder.pdf_link && (
              <Button variant="outline" onClick={() => window.open(purchaseOrder.pdf_link, '_blank')}>
                View PDF
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">PO Date:</span>
              </div>
              <div className="text-sm">
                {purchaseOrder.po_date
                  ? format(new Date(purchaseOrder.po_date), 'MMM d, yyyy')
                  : 'Not specified'}
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Amount:</span>
              </div>
              <div className="text-sm">
                {formatCurrency(purchaseOrder.total_amount || 0)}
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Amount Paid:</span>
              </div>
              <div className="text-sm">
                {formatCurrency(purchaseOrder.total_paid || 0)}
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Balance:</span>
              </div>
              <div className="text-sm">
                {formatCurrency(purchaseOrder.balance || 0)}
              </div>
              
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Products:</span>
              </div>
              <div className="text-sm">
                {purchaseOrder.product_count || 0} items
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendor Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-3 rounded-full">
                <User className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <p className="font-medium">{purchaseOrder.vendor_name || 'Unknown Vendor'}</p>
                <p className="text-sm text-muted-foreground">{purchaseOrder.vendor_email || ''}</p>
              </div>
            </div>
            
            {purchaseOrder.vendor_address && (
              <div className="text-sm border-t pt-4">
                <p className="font-medium mb-1">Address:</p>
                <p className="text-muted-foreground whitespace-pre-line">{purchaseOrder.vendor_address}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Products</CardTitle>
        </CardHeader>
        <CardContent>
          {purchaseOrder.products && purchaseOrder.products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium">Product</th>
                    <th className="text-right py-2 px-2 font-medium">Quantity</th>
                    <th className="text-right py-2 px-2 font-medium">Unit Price</th>
                    <th className="text-right py-2 px-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrder.products.map((product: any) => (
                    <tr key={product.id} className="border-b">
                      <td className="py-3 px-2">
                        <div className="font-medium">
                          {product.new_product_name || product.display_name || 'Unnamed Product'}
                        </div>
                        {product.vendor_product_name && (
                          <div className="text-sm text-muted-foreground italic">
                            Original Name: {product.vendor_product_name}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {product.total_qty_purchased || 0}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {formatCurrency(product.cost || 0)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {formatCurrency((product.total_qty_purchased || 0) * (product.cost || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t">
                    <td colSpan={2} className="py-3 px-2 font-medium">Total</td>
                    <td className="py-3 px-2 text-right font-medium">
                      {purchaseOrder.products.reduce((sum: number, p: any) => sum + (p.total_qty_purchased || 0), 0)} units
                    </td>
                    <td className="py-3 px-2 text-right font-medium">
                      {formatCurrency(purchaseOrder.products.reduce(
                        (sum: number, p: any) => sum + ((p.total_qty_purchased || 0) * (p.cost || 0)), 
                        0
                      ))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No products found for this purchase order.
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Status: <StatusBadge status={purchaseOrder.payment_status} /></p>
              <p className="text-sm text-muted-foreground mt-1">
                {purchaseOrder.payment_status === 'paid' 
                  ? 'This purchase order has been fully paid.' 
                  : purchaseOrder.payment_status === 'partial' 
                    ? 'This purchase order has been partially paid.' 
                    : 'This purchase order has not been paid yet.'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">Balance Due:</p>
              <p className="text-xl font-bold">{formatCurrency(purchaseOrder.balance || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrderDetail;