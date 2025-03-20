
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Calendar, FileText, User, CreditCard, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from 'react-router-dom';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { formatCurrency, formatDate } from '@/utils/format-utils';

const PurchaseOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPurchaseOrder } = usePurchaseOrders();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchPurchaseOrderData = async () => {
        setIsLoading(true);
        const data = await getPurchaseOrder(id);
        setPurchaseOrder(data);
        setIsLoading(false);
      };
      fetchPurchaseOrderData();
    }
  }, [id, getPurchaseOrder]);

  const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" | "success" | "warning" => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'sent':
        return 'default';
      case 'received':
        return 'warning';
      case 'partial':
        return 'warning';
      case 'complete':
        return 'success';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="container max-w-6xl py-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Purchase Order Not Found</h1>
        </div>
        <Card className="mt-6">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">The requested purchase order could not be found. It may have been deleted or you may not have permission to view it.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/purchase-orders')}>Back to Purchase Orders</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <Helmet>
        <title>PO #{purchaseOrder.number} | Billow</title>
      </Helmet>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">PO #{purchaseOrder.number}</h1>
          <Badge variant={getStatusVariant(purchaseOrder.status)} className="capitalize ml-2">
            {purchaseOrder.status}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit PO</Button>
          <Button>Record Payment</Button>
        </div>
      </div>

      {/* Purchase order information cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Vendor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium">
              {purchaseOrder.accountName}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">PO Date:</span>
              <span>{formatDate(purchaseOrder.date)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Amount
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">{formatCurrency(purchaseOrder.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid:</span>
              <span className="font-medium">{formatCurrency(purchaseOrder.total_paid)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance:</span>
              <span className="font-medium font-bold">{formatCurrency(purchaseOrder.balance)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items/Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products
          </CardTitle>
          <CardDescription>Products included in this purchase order</CardDescription>
        </CardHeader>
        <CardContent>
          {purchaseOrder.lineItems && purchaseOrder.lineItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrder.lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.productDetails ? (
                        <div className="flex items-center gap-2">
                          {item.productDetails.product_image1 && (
                            <div className="h-10 w-10 rounded-md border overflow-hidden flex-shrink-0">
                              <img 
                                src={item.productDetails.product_image1} 
                                alt={item.product_name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          <span className="font-medium">{item.product_name}</span>
                        </div>
                      ) : (
                        item.product_name
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {item.productDetails?.purchase_notes || '-'}
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No products have been added to this purchase order.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end border-t p-4">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span>{formatCurrency(purchaseOrder.total_amount)}</span>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Vendor Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>Payments made against this purchase order</CardDescription>
        </CardHeader>
        <CardContent>
          {purchaseOrder.vendorPayments && purchaseOrder.vendorPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrder.vendorPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.date ? formatDate(payment.date) : 'N/A'}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{payment.method || '-'}</TableCell>
                    <TableCell>{payment.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No payments have been recorded for this purchase order.
            </div>
          )}
        </CardContent>
        {purchaseOrder.status !== 'complete' && (
          <CardFooter className="border-t">
            <Button>Record New Payment</Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default PurchaseOrderDetail;
