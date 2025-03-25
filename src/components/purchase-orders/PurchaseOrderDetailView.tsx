
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, FileText, User, CreditCard, Package, ExternalLink } from 'lucide-react';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { formatCurrency } from '@/utils/format-utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EntityDetailLayout } from '@/components/common/EntityDetailLayout';
import { DetailCard } from '@/components/common/DetailCard';
import { PurchaseOrder } from '@/types/purchaseOrder';

const PurchaseOrderDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPurchaseOrder, isLoading } = usePurchaseOrders();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    if (id) {
      const fetchPurchaseOrderData = async () => {
        const data = await getPurchaseOrder(id);
        setPurchaseOrder(data);
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const actionButtons = (
    <>
      <Button variant="outline">Edit PO</Button>
      <Button>Record Payment</Button>
    </>
  );

  if (!purchaseOrder && !isLoading) {
    return (
      <EntityDetailLayout
        title={null}
        notFoundMessage="The requested purchase order could not be found. It may have been deleted or you may not have permission to view it."
        backLink="/purchase-orders"
      />
    );
  }

  return (
    <EntityDetailLayout
      title={purchaseOrder ? `PO #${purchaseOrder.number}` : 'Loading...'}
      status={purchaseOrder ? { label: purchaseOrder.status, variant: getStatusVariant(purchaseOrder.status) } : undefined}
      actions={actionButtons}
      isLoading={isLoading}
      backLink="/purchase-orders"
    >
      {/* Purchase order information cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DetailCard title="Vendor" icon={User}>
          {purchaseOrder?.vendorId ? (
            <Link to={`/accounts/${purchaseOrder.vendorId}`} className="font-medium hover:underline text-blue-600">
              {purchaseOrder.vendorName}
            </Link>
          ) : (
            <span className="text-muted-foreground">No vendor assigned</span>
          )}
        </DetailCard>

        <DetailCard title="Dates" icon={Calendar}>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">PO Date:</span>
              <span>{purchaseOrder?.date ? formatDate(purchaseOrder.date as Date) : 'N/A'}</span>
            </div>
            {purchaseOrder?.dueDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Due:</span>
                <span>{formatDate(purchaseOrder.dueDate as Date)}</span>
              </div>
            )}
          </div>
        </DetailCard>

        <DetailCard title="Amount" icon={FileText}>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">{formatCurrency(purchaseOrder?.total || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid:</span>
              <span className="font-medium">{formatCurrency(purchaseOrder?.amountPaid || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance:</span>
              <span className="font-medium font-bold">{formatCurrency(purchaseOrder?.balance || 0)}</span>
            </div>
          </div>
        </DetailCard>
      </div>

      {/* Line Items/Products */}
      <DetailCard 
        title="Products" 
        icon={Package}
        description="Products included in this purchase order"
      >
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
            {purchaseOrder?.lineItems?.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.productDetails ? (
                    <div className="flex items-center gap-2">
                      {item.productDetails.product_image1 && (
                        <div className="h-10 w-10 rounded-md border overflow-hidden flex-shrink-0">
                          <img 
                            src={item.productDetails.product_image1} 
                            alt={item.description}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <Link 
                        to={`/products/${item.productDetails.id}`}
                        className="font-medium hover:underline text-blue-600 flex items-center gap-1"
                      >
                        {item.productDetails.display_name || item.productDetails.name} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  ) : (
                    item.description
                  )}
                </TableCell>
                <TableCell className="max-w-xs">
                  {item.productDetails?.purchase_notes || '-'}
                </TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 w-full flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(purchaseOrder?.subtotal || purchaseOrder?.total || 0)}</span>
            </div>
            {purchaseOrder?.tax && purchaseOrder.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax:</span>
                <span>{formatCurrency(purchaseOrder.tax)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span>{formatCurrency(purchaseOrder?.total || 0)}</span>
            </div>
          </div>
        </div>
      </DetailCard>

      {/* Vendor Payments */}
      <DetailCard 
        title="Payment History" 
        icon={CreditCard}
        description="Payments made against this purchase order"
        footer={purchaseOrder?.status !== 'complete' ? <Button>Record New Payment</Button> : undefined}
      >
        {purchaseOrder?.vendorPayments && purchaseOrder.vendorPayments.length > 0 ? (
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
                  <TableCell>{payment.date ? formatDate(payment.date as Date) : 'N/A'}</TableCell>
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
      </DetailCard>

      {/* Notes */}
      {purchaseOrder?.notes && (
        <DetailCard title="Notes">
          <p className="whitespace-pre-wrap">{purchaseOrder.notes}</p>
        </DetailCard>
      )}
    </EntityDetailLayout>
  );
};

export default PurchaseOrderDetailView;
