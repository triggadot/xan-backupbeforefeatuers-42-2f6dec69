import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Invoice, LineItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ArrowLeft, Printer, Download, Save, Mail } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isNewInvoice = id === 'new';

  useEffect(() => {
    if (isNewInvoice) {
      setLoading(false);
      return;
    }

    const fetchInvoice = async () => {
      try {
        setLoading(true);
        
        // Fetch the invoice
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('gl_invoices')
          .select('*')
          .eq('id', id)
          .single();

        if (invoiceError) throw invoiceError;
        if (!invoiceData) throw new Error('Invoice not found');

        // Fetch line items
        const { data: lineItems, error: lineItemsError } = await supabase
          .from('gl_invoice_lines')
          .select('*')
          .eq('invoice_id', id);

        if (lineItemsError) throw lineItemsError;

        // Fetch account (customer) information
        const { data: account, error: accountError } = await supabase
          .from('gl_accounts')
          .select('*')
          .eq('id', invoiceData.account_id)
          .single();

        if (accountError) throw accountError;

        // Fetch payments
        const { data: payments, error: paymentsError } = await supabase
          .from('gl_customer_payments')
          .select('*')
          .eq('invoice_id', id);

        if (paymentsError) throw paymentsError;

        // Calculate totals
        const amountPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const balance = invoiceData.total - amountPaid;

        // Combine data
        setInvoice({
          ...invoiceData,
          lineItems: lineItems || [],
          accountName: account?.name || 'Unknown Customer',
          amountPaid,
          balance
        });
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice data');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, isNewInvoice]);

  // Go back to invoices list
  const handleBack = () => {
    navigate('/invoices');
  };

  // Format date for display
  const formatDateDisplay = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'PPP');
  };

  // Get status text and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'paid':
        return { text: 'Paid', color: 'text-green-600' };
      case 'overdue':
        return { text: 'Overdue', color: 'text-red-600' };
      case 'draft':
        return { text: 'Draft', color: 'text-gray-600' };
      case 'sent':
        return { text: 'Sent', color: 'text-amber-600' };
      default:
        return { text: status.charAt(0).toUpperCase() + status.slice(1), color: 'text-gray-600' };
    }
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
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {isNewInvoice 
            ? 'New Invoice | Billow Business Console' 
            : `Invoice ${invoice?.number} | Billow Business Console`}
        </title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="flex gap-2">
            {!isNewInvoice && (
              <>
                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
                <Button variant="outline">
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </>
            )}
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
        
        {isNewInvoice ? (
          <Card>
            <CardHeader>
              <CardTitle>New Invoice</CardTitle>
              <CardDescription>Create a new invoice</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Invoice creation form will be implemented here.
              </p>
            </CardContent>
          </Card>
        ) : invoice ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Invoice {invoice.number}</CardTitle>
                    <CardDescription>Customer: {invoice.accountName}</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className={`font-medium ${getStatusInfo(invoice.status).color}`}>
                      {getStatusInfo(invoice.status).text}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice Date</p>
                    <p>{formatDateDisplay(invoice.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p>{formatDateDisplay(invoice.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-medium">{formatCurrency(invoice.total)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="font-medium">{formatCurrency(invoice.balance)}</p>
                  </div>
                </div>
                
                {invoice.paymentDate && (
                  <div className="bg-green-50 text-green-700 px-4 py-2 rounded-md mb-6">
                    <p className="text-sm">
                      <span className="font-medium">Payment received on:</span> {formatDateDisplay(invoice.paymentDate)}
                      {invoice.paymentTerms && ` - ${invoice.paymentTerms}`}
                    </p>
                  </div>
                )}
                
                {invoice.lineItems && invoice.lineItems.length > 0 ? (
                  <>
                    <Separator className="my-4" />
                    <h3 className="text-lg font-medium mb-4">Line Items</h3>
                    <div className="space-y-4">
                      {invoice.lineItems.map((item: LineItem) => (
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
                    
                    <div className="mt-6 space-y-2 max-w-xs ml-auto">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatCurrency(invoice.subtotal)}</span>
                      </div>
                      {invoice.tax > 0 && (
                        <div className="flex justify-between">
                          <span>Tax</span>
                          <span>{formatCurrency(invoice.tax)}</span>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(invoice.total)}</span>
                      </div>
                      {invoice.amountPaid > 0 && (
                        <>
                          <div className="flex justify-between text-green-600">
                            <span>Amount Paid</span>
                            <span>{formatCurrency(invoice.amountPaid)}</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>Balance Due</span>
                            <span>{formatCurrency(invoice.balance)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No line items found for this invoice.
                  </div>
                )}
                
                {invoice.notes && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h3 className="text-lg font-medium mb-2">Notes</h3>
                      <p className="whitespace-pre-line">{invoice.notes}</p>
                    </div>
                  </>
                )}
                
                {invoice.estimateId && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h3 className="text-lg font-medium mb-2">Converted From</h3>
                      <p className="text-sm">
                        This invoice was converted from estimate{' '}
                        <Button 
                          variant="link" 
                          className="p-0 h-auto" 
                          onClick={() => navigate(`/estimates/${invoice.estimateId}`)}
                        >
                          {invoice.estimateId}
                        </Button>
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2 bg-muted/20">
                <Button variant="outline">Edit Invoice</Button>
                <Button variant="outline">Record Payment</Button>
                {invoice.status === 'draft' && (
                  <Button>Mark as Sent</Button>
                )}
                {invoice.status === 'sent' && (
                  <Button>Mark as Paid</Button>
                )}
              </CardFooter>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-muted-foreground">Invoice not found</h2>
          </div>
        )}
      </div>
    </>
  );
} 