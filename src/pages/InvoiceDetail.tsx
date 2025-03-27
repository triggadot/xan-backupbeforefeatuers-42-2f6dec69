
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { InvoiceWithDetails } from '@/types/invoice';
import { useInvoicesView } from '@/hooks/invoices/useInvoicesView';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
  const { getInvoice, isLoading, error } = useInvoicesView();
  
  useEffect(() => {
    const loadInvoice = async () => {
      if (id) {
        const data = await getInvoice(id);
        if (data) {
          setInvoice(data);
        }
      }
    };
    
    loadInvoice();
  }, [id, getInvoice]);

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Loading Invoice | Glide Sync</title>
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

  if (error || !invoice) {
    return (
      <>
        <Helmet>
          <title>Invoice Not Found | Glide Sync</title>
        </Helmet>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Invoice Not Found</h2>
              <p className="text-muted-foreground">
                {error || "The requested invoice could not be found."}
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{invoice.invoiceNumber || 'Invoice Details'} | Glide Sync</title>
      </Helmet>
      <ScrollAnimation type="fade" className="w-full">
        <div className="container mx-auto py-6">
          {invoice && (
            <div className="space-y-6">
              {/* Note: In a separate implementation, a proper InvoiceDetailComponent would be created */}
              <Card>
                <CardContent className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Invoice #{invoice.invoiceNumber}</h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground">Customer</p>
                      <p className="font-medium">{invoice.customerName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">{invoice.status}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">{invoice.invoiceDate?.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Due Date</p>
                      <p className="font-medium">{invoice.dueDate?.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-medium">${invoice.total.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Balance</p>
                      <p className="font-medium">${invoice.balance.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Line Items */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Line Items</h2>
                  {invoice.lineItems && invoice.lineItems.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {invoice.lineItems.map((item, index) => (
                            <tr key={item.id || index}>
                              <td className="px-4 py-2 whitespace-nowrap">{item.productName}</td>
                              <td className="px-4 py-2">{item.description}</td>
                              <td className="px-4 py-2 text-right">{item.quantity}</td>
                              <td className="px-4 py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                              <td className="px-4 py-2 text-right">${item.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={4} className="px-4 py-2 text-right font-medium">Subtotal</td>
                            <td className="px-4 py-2 text-right font-medium">${invoice.subtotal.toFixed(2)}</td>
                          </tr>
                          {invoice.tax_rate > 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-2 text-right font-medium">Tax ({invoice.tax_rate}%)</td>
                              <td className="px-4 py-2 text-right font-medium">${invoice.tax_amount.toFixed(2)}</td>
                            </tr>
                          )}
                          <tr>
                            <td colSpan={4} className="px-4 py-2 text-right font-bold">Total</td>
                            <td className="px-4 py-2 text-right font-bold">${invoice.total.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No line items found for this invoice.</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Payments */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Payments</h2>
                  {invoice.payments && invoice.payments.length > 0 ? (
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
                          {invoice.payments.map((payment, index) => (
                            <tr key={payment.id || index}>
                              <td className="px-4 py-2 whitespace-nowrap">{payment.date.toLocaleDateString()}</td>
                              <td className="px-4 py-2">{payment.paymentMethod}</td>
                              <td className="px-4 py-2 text-right">${payment.amount.toFixed(2)}</td>
                              <td className="px-4 py-2">{payment.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={2} className="px-4 py-2 text-right font-medium">Total Paid</td>
                            <td className="px-4 py-2 text-right font-medium">${invoice.amountPaid.toFixed(2)}</td>
                            <td></td>
                          </tr>
                          <tr>
                            <td colSpan={2} className="px-4 py-2 text-right font-bold">Balance</td>
                            <td className="px-4 py-2 text-right font-bold">${invoice.balance.toFixed(2)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No payments recorded for this invoice.</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Notes */}
              {invoice.notes && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Notes</h2>
                    <p className="whitespace-pre-wrap">{invoice.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </ScrollAnimation>
    </>
  );
};

export default InvoiceDetail;
