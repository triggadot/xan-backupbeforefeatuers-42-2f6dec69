import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder, LineItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ArrowLeft, Printer, Download, Save } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isNewPO = id === 'new';

  useEffect(() => {
    if (isNewPO) {
      setLoading(false);
      return;
    }

    const fetchPurchaseOrder = async () => {
      try {
        setLoading(true);
        
        // Fetch the purchase order
        const { data: poData, error: poError } = await supabase
          .from('gl_purchase_orders')
          .select('*')
          .eq('id', id)
          .single();

        if (poError) throw poError;
        if (!poData) throw new Error('Purchase order not found');

        // Fetch line items
        const { data: lineItems, error: lineItemsError } = await supabase
          .from('gl_purchase_order_items')
          .select('*')
          .eq('purchase_order_id', id);

        if (lineItemsError) throw lineItemsError;

        // Fetch account (vendor) information
        const { data: account, error: accountError } = await supabase
          .from('gl_accounts')
          .select('*')
          .eq('id', poData.account_id)
          .single();

        if (accountError) throw accountError;

        // Fetch payments
        const { data: payments, error: paymentsError } = await supabase
          .from('gl_vendor_payments')
          .select('*')
          .eq('purchase_order_id', id);

        if (paymentsError) throw paymentsError;

        // Calculate totals
        const amountPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const balance = poData.total - amountPaid;

        // Combine data
        setPurchaseOrder({
          ...poData,
          lineItems: lineItems || [],
          accountName: account?.name || 'Unknown Vendor',
          amountPaid,
          balance
        });
      } catch (err) {
        console.error('Error fetching purchase order:', err);
        setError('Failed to load purchase order data');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrder();
  }, [id, isNewPO]);

  // Go back to purchase orders list
  const handleBack = () => {
    navigate('/purchase-orders');
  };

  // Format date for display
  const formatDateDisplay = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'PPP');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-12">
        <h2 className="text-xl font-semibold text-red-500 mb-4">{error}</h2>
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Purchase Orders
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {isNewPO 
            ? 'New Purchase Order | Billow Business Console' 
            : `Purchase Order ${purchaseOrder?.number} | Billow Business Console`}
        </title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
        
        {isNewPO ? (
          <Card>
            <CardHeader>
              <CardTitle>New Purchase Order</CardTitle>
              <CardDescription>Create a new purchase order</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Purchase order creation form will be implemented here.
              </p>
            </CardContent>
          </Card>
        ) : purchaseOrder ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Purchase Order {purchaseOrder.number}</CardTitle>
                    <CardDescription>Vendor: {purchaseOrder.accountName}</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className={`font-medium ${
                      purchaseOrder.balance <= 0 
                        ? 'text-green-600' 
                        : purchaseOrder.amountPaid > 0 
                          ? 'text-amber-600' 
                          : 'text-red-600'
                    }`}>
                      {purchaseOrder.balance <= 0 
                        ? 'Paid' 
                        : purchaseOrder.amountPaid > 0 
                          ? 'Partial' 
                          : 'Unpaid'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Order Date</p>
                    <p>{formatDateDisplay(purchaseOrder.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Delivery</p>
                    <p>{formatDateDisplay(purchaseOrder.expectedDeliveryDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-medium">{formatCurrency(purchaseOrder.total)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Balance Due</p>
                    <p className="font-medium">{formatCurrency(purchaseOrder.balance)}</p>
                  </div>
                </div>
                
                {purchaseOrder.lineItems && purchaseOrder.lineItems.length > 0 ? (
                  <>
                    <Separator className="my-4" />
                    <h3 className="text-lg font-medium mb-4">Line Items</h3>
                    <div className="space-y-4">
                      {purchaseOrder.lineItems.map((item: LineItem) => (
                        <div key={item.id} className="grid grid-cols-6 gap-4 p-3 bg-muted/20 rounded">
                          <div className="col-span-3">
                            <p className="font-medium">{item.description}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Quantity</p>
                            <p>{item.quantity}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Unit Price</p>
                            <p>{formatCurrency(item.unitPrice)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="font-medium">{formatCurrency(item.total)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatCurrency(purchaseOrder.subtotal)}</span>
                      </div>
                      {purchaseOrder.tax > 0 && (
                        <div className="flex justify-between">
                          <span>Tax</span>
                          <span>{formatCurrency(purchaseOrder.tax)}</span>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(purchaseOrder.total)}</span>
                      </div>
                      {purchaseOrder.amountPaid > 0 && (
                        <>
                          <div className="flex justify-between text-green-600">
                            <span>Amount Paid</span>
                            <span>{formatCurrency(purchaseOrder.amountPaid)}</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>Balance Due</span>
                            <span>{formatCurrency(purchaseOrder.balance)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No line items found for this purchase order.
                  </div>
                )}
                
                {purchaseOrder.notes && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h3 className="text-lg font-medium mb-2">Notes</h3>
                      <p className="whitespace-pre-line">{purchaseOrder.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2 bg-muted/20">
                <Button variant="outline">Edit Purchase Order</Button>
                <Button variant="outline">Record Payment</Button>
                <Button>View Payments</Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-muted-foreground">Purchase order not found</h2>
          </div>
        )}
      </div>
    </>
  );
} 