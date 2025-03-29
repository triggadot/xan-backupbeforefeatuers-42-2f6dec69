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
  purchaseOrder: PurchaseOrder | null;
  isLoading: boolean;
  onRefresh?: () => void;
}

const PurchaseOrderDetailView = ({
  purchaseOrder,
  isLoading,
  onRefresh,
}: PurchaseOrderDetailViewProps) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/purchase-orders');
  };

  const handleEdit = () => {
    if (purchaseOrder) {
      navigate(`/purchase-orders/edit/${purchaseOrder.id}`);
    }
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
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Purchase order not found.
          </div>
          <Button onClick={handleGoBack} variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Purchase Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <Button onClick={handleGoBack} variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Purchase Orders
          </Button>
          <div className="flex space-x-2">
            {onRefresh && (
              <Button onClick={onRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
            <Button onClick={handleEdit} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
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
                    {purchaseOrder.date
                      ? formatDate(new Date(purchaseOrder.date))
                      : 'N/A'}
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
              <CardTitle>Vendor Information</CardTitle>
            </CardHeader>
            <CardContent>
              {purchaseOrder.vendor ? (
                <div className="space-y-2">
                  <p className="font-semibold">{purchaseOrder.vendor.account_name || 'No name provided'}</p>
                  <p>{purchaseOrder.vendor.email || purchaseOrder.vendor.account_email || 'No email provided'}</p>
                  <p>{purchaseOrder.vendor.phone || purchaseOrder.vendor.account_phone || 'No phone provided'}</p>
                  <p>{purchaseOrder.vendor.address || purchaseOrder.vendor.account_address || 'No address provided'}</p>
                </div>
              ) : (
                <p className="text-gray-500">No vendor information available</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            {purchaseOrder.lineItems && purchaseOrder.lineItems.length > 0 ? (
              <div className="overflow-x-auto">
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
                    {purchaseOrder.lineItems.map((item: PurchaseOrderLineItem) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{item.product_name || 'Unnamed Product'}</div>
                          {item.vendor_product_name && (
                            <div className="text-xs text-gray-500">{item.vendor_product_name}</div>
                          )}
                          {item.notes && <div className="text-xs text-gray-500 mt-1">{item.notes}</div>}
                          {(item.samples || item.fronted) && (
                            <div className="mt-1 flex gap-1">
                              {item.samples && (
                                <Badge variant="outline" className="text-xs">Sample</Badge>
                              )}
                              {item.fronted && (
                                <Badge variant="outline" className="text-xs">Fronted</Badge>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">{item.quantity}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.total)}</td>
                        <td className="py-3 px-4 text-center">
                          {item.category && (
                            <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
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
              </div>
            ) : (
              <p className="text-gray-500">No line items found for this purchase order.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {purchaseOrder.vendorPayments && purchaseOrder.vendorPayments.length > 0 ? (
              <div className="overflow-x-auto">
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
                    {purchaseOrder.vendorPayments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {payment.date ? formatDate(new Date(payment.date)) : 'N/A'}
                        </td>
                        <td className="py-3 px-4">{payment.method || 'N/A'}</td>
                        <td className="py-3 px-4 text-right font-medium">
                          {formatCurrency(payment.amount || 0)}
                        </td>
                        <td className="py-3 px-4">{payment.notes || ''}</td>
                      </tr>
                    ))}
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
              </div>
            ) : (
              <p className="text-gray-500">No payment history found for this purchase order.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PurchaseOrderDetailView;
