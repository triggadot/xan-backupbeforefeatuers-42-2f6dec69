
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { usePurchaseOrdersView } from '@/hooks/purchase-orders/usePurchaseOrdersView';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'draft': return 'bg-gray-200 text-gray-800';
    case 'sent': return 'bg-blue-100 text-blue-800';
    case 'partial': return 'bg-yellow-100 text-yellow-800';
    case 'paid': 
    case 'complete': return 'bg-green-100 text-green-800';
    case 'overdue': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const PurchaseOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const { getPurchaseOrder, isLoading, error } = usePurchaseOrdersView();
  
  useEffect(() => {
    const loadPurchaseOrder = async () => {
      if (id) {
        const data = await getPurchaseOrder(id);
        if (data) {
          setPurchaseOrder(data);
        }
      }
    };
    
    loadPurchaseOrder();
  }, [id, getPurchaseOrder]);

  const handleBack = () => {
    navigate('/purchase-orders');
  };

  const handleEdit = () => {
    if (id) {
      navigate(`/purchase-orders/${id}/edit`);
    }
  };

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Loading Purchase Order | Glide Sync</title>
        </Helmet>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-6 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (error || !purchaseOrder) {
    return (
      <>
        <Helmet>
          <title>Purchase Order Not Found | Glide Sync</title>
        </Helmet>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Purchase Order Not Found</h2>
              <p className="text-muted-foreground">
                {error || "The requested purchase order could not be found."}
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Purchase Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`Purchase Order #${purchaseOrder.number}`} | Glide Sync</title>
      </Helmet>
      <ScrollAnimation type="fade" className="w-full">
        <div className="container mx-auto py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Purchase Order #{purchaseOrder.number}
              <Badge className={getStatusColor(purchaseOrder.status)} variant="outline">
                {purchaseOrder.status}
              </Badge>
            </h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button 
                variant="outline" 
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Vendor Information</h2>
                <p className="font-medium text-lg">{purchaseOrder.vendorName}</p>
                {purchaseOrder.vendor && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {/* Add vendor details if available */}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p>{formatDate(purchaseOrder.date)}</p>
                  </div>
                  {purchaseOrder.dueDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Date</p>
                      <p>{formatDate(purchaseOrder.dueDate)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-bold">{formatCurrency(purchaseOrder.total || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className={`font-bold ${purchaseOrder.balance > 0 ? 'text-red-600' : ''}`}>
                      {formatCurrency(purchaseOrder.balance || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Line Items */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Products</h2>
              {purchaseOrder.lineItems && purchaseOrder.lineItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {purchaseOrder.lineItems.map((item, index) => (
                        <tr key={item.id || index}>
                          <td className="px-4 py-2">{item.product_name || item.description}</td>
                          <td className="px-4 py-2">{item.notes || 'No description'}</td>
                          <td className="px-4 py-2 text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="px-4 py-2 text-right font-bold">Total</td>
                        <td className="px-4 py-2 text-right font-bold">{formatCurrency(purchaseOrder.total || 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No products found for this purchase order.</p>
              )}
            </CardContent>
          </Card>
          
          {/* Payments */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Payments</h2>
              {purchaseOrder.vendorPayments && purchaseOrder.vendorPayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {purchaseOrder.vendorPayments.map((payment, index) => (
                        <tr key={payment.id || index}>
                          <td className="px-4 py-2">{formatDate(payment.date)}</td>
                          <td className="px-4 py-2">{payment.method || 'Payment'}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(payment.amount)}</td>
                          <td className="px-4 py-2">{payment.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} className="px-4 py-2 text-right font-bold">Total Paid</td>
                        <td className="px-4 py-2 text-right font-bold">{formatCurrency(purchaseOrder.amountPaid || 0)}</td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="px-4 py-2 text-right font-bold">Balance</td>
                        <td className="px-4 py-2 text-right font-bold">{formatCurrency(purchaseOrder.balance || 0)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No payments recorded for this purchase order.</p>
              )}
            </CardContent>
          </Card>
          
          {/* Notes */}
          {purchaseOrder.notes && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Notes</h2>
                <p className="whitespace-pre-wrap">{purchaseOrder.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollAnimation>
    </>
  );
};

export default PurchaseOrderDetail;
