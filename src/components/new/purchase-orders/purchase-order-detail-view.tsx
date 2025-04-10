import { useMemo, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Printer, Edit, RefreshCw, Database } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PurchaseOrder, PurchaseOrderLineItem } from '@/types/purchaseOrder';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/utils/use-toast';
import { PDFActions } from '@/components/pdf/PDFActions';

interface PurchaseOrderDetailViewProps {
  purchaseOrder: PurchaseOrder | null;
  isLoading: boolean;
  onRefresh?: () => void;
}

const PurchaseOrderDetailView = ({
  purchaseOrder,
  isLoading,
  onRefresh
}: PurchaseOrderDetailViewProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // Initialize with the current PDF URL, but we'll always regenerate when viewing/downloading
  const [pdfUrl, setPdfUrl] = useState<string | null>(purchaseOrder?.supabase_pdf_url || null);
  
  useEffect(() => {
    if (purchaseOrder?.supabase_pdf_url) {
      setPdfUrl(purchaseOrder.supabase_pdf_url);
    }
  }, [purchaseOrder]);
  
  useEffect(() => {
    if (purchaseOrder?.lineItems) {
      console.log('Line items in detail view:', purchaseOrder.lineItems);
      purchaseOrder.lineItems.forEach((item, index) => {
        console.log(`Line item ${index}:`, item);
        console.log(`Line item ${index} vendor_product_name:`, item.vendor_product_name);
      });
    }
  }, [purchaseOrder]);
  
  const handleGoBack = () => {
    navigate('/purchase-orders');
  };
  
  const handleEdit = () => {
    if (purchaseOrder) {
      navigate(`/purchase-orders/edit/${purchaseOrder.id}`);
    }
  };

  const checkDatabase = async () => {
    if (!purchaseOrder) return;
    try {
      const {
        data: poData,
        error: poError
      } = await supabase.from('gl_purchase_orders').select('*').eq('id', purchaseOrder.id).single();
      if (poError) {
        console.error('Error fetching purchase order:', poError);
        toast({
          title: 'Error',
          description: 'Error fetching purchase order: ' + poError.message,
          variant: 'destructive'
        });
        return;
      }
      console.log('Purchase order from DB:', poData);

      const {
        data: productsData,
        error: productsError
      } = await supabase.from('gl_products').select('*').eq('rowid_purchase_orders', poData.glide_row_id);
      if (productsError) {
        console.error('Error fetching products:', productsError);
        toast({
          title: 'Error',
          description: 'Error fetching products: ' + productsError.message,
          variant: 'destructive'
        });
        return;
      }
      console.log('Products from DB:', productsData);

      if (productsData && productsData.length > 0) {
        productsData.forEach((product, index) => {
          console.log(`Product ${index} full data:`, product);
          console.log(`Product ${index} vendor_product_name:`, product.vendor_product_name);
          console.log(`Product ${index} available fields:`, Object.keys(product));
        });
        toast({
          title: 'Database Check',
          description: `Found ${productsData.length} products. Check console for details.`
        });
      } else {
        toast({
          title: 'No Products',
          description: 'No products found for this purchase order.',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('Error checking database:', err);
      toast({
        title: 'Error',
        description: 'An error occurred while checking the database.',
        variant: 'destructive'
      });
    }
  };

  const handlePrintInvoice = () => {
    toast({
      title: 'Print Purchase Order',
      description: 'Preparing purchase order for printing...'
    });

    window.print();
  };

  const handlePDFSuccess = (url: string) => {
    setPdfUrl(url);
    toast({
      title: 'PDF Generated',
      description: 'The purchase order PDF has been generated successfully.'
    });
  };

  const handlePDFError = (error: any) => {
    toast({
      title: 'PDF Generation Failed',
      description: error instanceof Error ? error.message : 'An error occurred while generating the PDF.',
      variant: 'destructive'
    });
  };

  const statusColor = useMemo(() => {
    if (!purchaseOrder) return 'bg-gray-100 text-gray-800';
    switch (purchaseOrder.status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  }, [purchaseOrder]);

  if (isLoading) {
    return <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>;
  }
  
  if (!purchaseOrder) {
    return <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Purchase order not found.
          </div>
          <Button onClick={handleGoBack} variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Purchase Orders
          </Button>
        </div>
      </div>;
  }

  const getVendorProperty = (property: string): string => {
    if (!purchaseOrder.vendor) return '';
    const vendor = purchaseOrder.vendor as any;
    return vendor[property] || '';
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <Button onClick={handleGoBack} variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Purchase Orders
          </Button>
          <div className="flex space-x-2 mt-4">
            <Button variant="outline" size="sm" onClick={handleGoBack} className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back to List
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleEdit} className="flex items-center gap-1">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            
            <PDFActions 
              documentType="purchaseOrder" 
              document={purchaseOrder} 
              variant="outline" 
              size="sm"
              showLabels={true}
              forceRegenerate={true}
              overwriteExisting={true}
              onPDFGenerated={(url) => setPdfUrl(url)}
            />
            
            <Button variant="outline" size="sm" onClick={handlePrintInvoice} className="flex items-center gap-1">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} className="flex items-center gap-1">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            )}
            
            {process.env.NODE_ENV === 'development' && (
              <Button variant="outline" size="sm" onClick={checkDatabase} className="flex items-center gap-1">
                <Database className="h-4 w-4" />
                Check DB
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Purchase Order Details</CardTitle>
                <Badge className={statusColor}>{purchaseOrder.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Purchase Order #</p>
                  <p className="text-lg font-semibold">{purchaseOrder.number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-lg">
                    {purchaseOrder.date ? formatDate(new Date(purchaseOrder.date)) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Vendor</p>
                  <p className="text-lg font-semibold">{purchaseOrder.vendorName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Amount</p>
                  <p className="text-lg font-semibold">{formatCurrency(purchaseOrder.total_amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Paid</p>
                  <p className="text-lg">{formatCurrency(purchaseOrder.total_paid || 0)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Balance</p>
                  <p className="text-lg font-semibold">{formatCurrency(purchaseOrder.balance || 0)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Units</p>
                  <p className="text-lg">{purchaseOrder.totalUnits || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Cost</p>
                  <p className="text-lg font-semibold">{formatCurrency(purchaseOrder.totalCost || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              {purchaseOrder.lineItems && purchaseOrder.lineItems.length > 0 ? <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-left font-medium">Product</th>
                        <th className="py-2 px-4 text-right font-medium">Quantity</th>
                        <th className="py-2 px-4 text-right font-medium">Cost</th>
                        <th className="py-2 px-4 text-right font-medium">Total</th>
                        <th className="py-2 px-4 text-center font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrder.lineItems.map((item: PurchaseOrderLineItem) => <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium">{item.display_name || item.new_product_name || item.vendor_product_name || 'Unnamed Product'}</div>
                            {item.vendor_product_name && item.display_name !== item.vendor_product_name && <div className="text-xs text-gray-500">Vendor's Product Name: "{item.vendor_product_name}"</div>}
                            {item.notes && <div className="text-xs text-gray-500 mt-1">{item.notes}</div>}
                            {(item.samples || item.fronted) && <div className="mt-1 flex gap-1">
                                {item.samples && <Badge variant="outline" className="text-xs">Sample</Badge>}
                                {item.fronted && <Badge variant="outline" className="text-xs">Fronted</Badge>}
                              </div>}
                          </td>
                          <td className="py-3 px-4 text-right">{item.quantity}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.total)}</td>
                          <td className="py-3 px-4 text-center">
                            {item.category && <Badge variant="secondary" className="text-xs">{item.category}</Badge>}
                          </td>
                        </tr>)}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td className="py-3 px-4 font-medium">Total</td>
                        <td className="py-3 px-4 text-right font-medium">{purchaseOrder.totalUnits || 0}</td>
                        <td className="py-3 px-4"></td>
                        <td className="py-3 px-4 text-right font-medium">{formatCurrency(purchaseOrder.totalCost || 0)}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={statusColor}>{purchaseOrder.status}</Badge>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div> : <p className="text-gray-500">No line items found for this purchase order.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {purchaseOrder.vendorPayments && purchaseOrder.vendorPayments.length > 0 ? <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-left font-medium">Date</th>
                        <th className="py-2 px-4 text-left font-medium">Method</th>
                        <th className="py-2 px-4 text-right font-medium">Amount</th>
                        <th className="py-2 px-4 text-left font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrder.vendorPayments.map(payment => {
                    const paymentAny = payment as any;
                    return <tr key={payment.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              {payment.date ? formatDate(new Date(payment.date)) : 'N/A'}
                            </td>
                            <td className="py-3 px-4">{payment.method || 'N/A'}</td>
                            <td className="py-3 px-4 text-right font-medium">
                              {formatCurrency(payment.amount || paymentAny.payment_amount || 0)}
                            </td>
                            <td className="py-3 px-4">{payment.notes || paymentAny.vendor_purchase_note || ''}</td>
                          </tr>;
                  })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={2} className="py-3 px-4 font-medium">Total Paid</td>
                        <td className="py-3 px-4 text-right font-medium">{formatCurrency(purchaseOrder.total_paid || 0)}</td>
                        <td></td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td colSpan={2} className="py-3 px-4 font-medium">Balance</td>
                        <td className="py-3 px-4 text-right font-medium">{formatCurrency(purchaseOrder.balance || 0)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div> : <p className="text-gray-500">No payment history found for this purchase order.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetailView;
