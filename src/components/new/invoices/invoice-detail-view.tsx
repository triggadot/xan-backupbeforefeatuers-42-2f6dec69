import React, { useMemo, useState } from 'react';
import { InvoiceWithAccount } from '@/types/new/invoice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/utils/use-toast';
import { format } from 'date-fns';
import { PDFActions } from '@/components/pdf/PDFActions';
import { usePDFOperations } from '@/hooks/pdf/usePDFOperations';
import { Printer } from 'lucide-react';

interface InvoiceDetailViewProps {
  invoice: InvoiceWithAccount;
}

/**
 * Displays the details of a single invoice, including line items.
 */
const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({ invoice }) => {
  const { toast } = useToast();

  const statusColor = () => {
    switch (invoice.payment_status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'overdue':
        return 'destructive';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  // For debugging purposes
  console.log("Rendering InvoiceDetailView with invoice:", invoice);

  // Calculate subtotal if tax information is available
  const subtotal = invoice.tax_amount ? (invoice.total_amount || 0) - (invoice.tax_amount || 0) : invoice.total_amount || 0;

  // Calculate total quantity
  const totalQuantity = invoice.lines?.reduce((total, line) => total + (Number(line.qty_sold) || 0), 0) || 0;

  // PDF operations
  const [pdfUrl, setPdfUrl] = useState<string | null>(invoice.supabase_pdf_url || null);

  // Generate invoice number using format INV#[account_uid]MMDDYY
  const formattedInvoiceNumber = useMemo(() => {
    try {
      // Get account_uid from account, if available
      const accountUid = invoice.account?.accounts_uid || 'NOACC';
      
      // Format the date as MMDDYY
      let dateString = 'NODATE';
      if (invoice.invoice_order_date) {
        const invoiceDate = new Date(invoice.invoice_order_date);
        dateString = format(invoiceDate, 'MMddyy');
      }
      
      // Create the formatted invoice number
      return `INV#${accountUid}${dateString}`;
    } catch (err) {
      console.error('Error formatting invoice number:', err);
      return invoice.id?.substring(0, 8) || 'Unknown';
    }
  }, [invoice]);

  // Handle printing
  const handlePrintInvoice = () => {
    toast({
      title: 'Print Invoice',
      description: 'Preparing invoice for printing...',
    });
    
    // You can use window.print() or a more sophisticated approach
    window.print();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      {/* Debug panel - visible only in development */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="bg-yellow-100 p-4 text-xs font-mono border-b border-yellow-200">
          <h3 className="font-bold mb-2">Debug Information:</h3>
          <div><strong>Invoice ID:</strong> {invoice.id}</div>
          <div><strong>Glide Row ID:</strong> {invoice.glide_row_id}</div>
          <div><strong>Account ID:</strong> {invoice.rowid_accounts}</div>
          <div><strong>Status:</strong> {invoice.payment_status}</div>
          <div><strong>Line Items:</strong> {invoice.lines?.length || 0}</div>
          <div><strong>Has Account:</strong> {invoice.account ? 'Yes' : 'No'}</div>
        </div>
      )}

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">
          {formattedInvoiceNumber}
          {invoice.glide_row_id && <span className="ml-2 text-sm text-gray-500">{invoice.glide_row_id}</span>}
        </CardTitle>
        <Badge
          variant={statusColor()}
          className="text-xs font-semibold uppercase"
        >
          {(invoice.payment_status || 'draft').toUpperCase()}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Invoice #{invoice.invoice_uid || formattedInvoiceNumber}
            </h2>
            <p className="text-gray-500">
              {invoice.gl_accounts?.account_name || 'No Account'}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <PDFActions 
              documentType="invoice"
              document={invoice}
              variant="outline"
              size="sm"
              showLabels={true}
              onPDFGenerated={(url) => setPdfUrl(url)}
            />
            <Button variant="outline" size="sm" onClick={handlePrintInvoice}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Invoice Date</h3>
            <p className="text-gray-900">{formatDate(invoice.invoice_order_date)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
            <p className="text-gray-900">{formatDate(invoice.due_date)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Customer</h3>
            <p className="text-gray-900">{invoice.gl_accounts?.account_name || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <Badge variant={statusColor()}>
              {(invoice.payment_status || 'draft').toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Line Items */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lines && invoice.lines.length > 0 ? (
                invoice.lines.map((line, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{line.renamed_product_name || 'Unnamed Product'}</TableCell>
                    <TableCell className="text-right">{line.qty_sold || 0}</TableCell>
                    <TableCell className="text-right">{formatCurrency(line.selling_price || 0)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(line.line_total || 0)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">No line items found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
        <div className="mt-6 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          
          {invoice.tax_amount && invoice.tax_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Tax ({invoice.tax_rate || 0}%)</span>
              <span>{formatCurrency(invoice.tax_amount)}</span>
            </div>
          )}
          
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(invoice.total_amount || 0)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Paid</span>
            <span>{formatCurrency(invoice.total_paid || 0)}</span>
          </div>
          
          <div className="flex justify-between font-bold pt-2 border-t">
            <span>Balance</span>
            <span>{formatCurrency(invoice.balance || 0)}</span>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceDetailView;
