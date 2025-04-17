
import React, { useMemo, useState } from 'react';
import { InvoiceWithAccount } from '@/types/new/invoice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PDFActions } from '@/components/pdf/PDFActions';
import { useToast } from '@/hooks/utils/use-toast';
import { format } from 'date-fns';
import { usePDF } from '@/hooks/pdf/usePDF';
import { DocumentType } from '@/types/pdf.unified';
import { AmountDisplay } from '@/components/shared/AmountDisplay';

interface InvoiceDetailViewProps {
  invoice: InvoiceWithAccount;
}

/**
 * Displays the details of a single invoice, including line items.
 */
const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoice
}) => {
  const {
    toast
  } = useToast();
  const statusColor = () => {
    switch (invoice.payment_status?.toLowerCase()) {
      case 'paid':
        return 'success';
      // Green
      case 'partial':
        // Updated from 'partially paid' or similar
        return 'warning';
      // Yellow
      case 'unpaid':
        return 'destructive';
      // Red
      case 'credit':
        // New status
        return 'secondary';
      // Blue (assuming 'info' variant exists)
      case 'draft': // Explicitly handle draft
      default:
        // Default includes draft and any unexpected values
        return 'secondary';
      // Gray
    }
  };

  // Calculate subtotal if tax information is available
  const subtotal = invoice.tax_amount ? (invoice.total_amount || 0) - (invoice.tax_amount || 0) : invoice.total_amount || 0;

  // Calculate item count
  const itemCount = invoice.lines?.length || 0;

  // PDF operations
  // Initialize with the current PDF URL, but we'll always regenerate when viewing/downloading
  const [pdfUrl, setPdfUrl] = useState<string | null>(invoice.supabase_pdf_url || null);
  const {
    generatePDF,
    isGenerating: loading
  } = usePDF();

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
  return <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        
        <Badge variant={statusColor()} className="text-xs font-semibold uppercase">
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
              {invoice.gl_accounts?.balance !== undefined && <span className="ml-2">
                  <AmountDisplay amount={invoice.gl_accounts.balance} variant="auto" showLabel={true} className="text-sm" />
                </span>}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <PDFActions 
              documentType={DocumentType.INVOICE} 
              document={invoice} 
              variant="outline" 
              size="sm" 
              showLabels={true} 
              onPDFGenerated={url => setPdfUrl(url)} 
            />
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Invoice Date</h3>
            <p className="text-gray-900">{formatDate(invoice.invoice_order_date)}</p>
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
              {invoice.lines && invoice.lines.length > 0 ? invoice.lines.map((line, index) => <TableRow key={index}>
                    <TableCell className="font-medium">{line.product_name_display || line.renamed_product_name || 'Unnamed Product'}</TableCell>
                    <TableCell className="text-right">{line.qty_sold || 0}</TableCell>
                    <TableCell className="text-right">{formatCurrency(line.selling_price || 0)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(line.line_total || 0)}</TableCell>
                  </TableRow>) : <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">No line items found</TableCell>
                </TableRow>}
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
        <div className="mt-6 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">
              Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''}):
            </span>
            <AmountDisplay amount={subtotal} />
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Paid:</span>
            <AmountDisplay amount={invoice.total_paid || 0} variant={invoice.total_paid ? 'success' : 'default'} />
          </div>
          
          <div className="flex justify-between font-bold pt-2 border-t">
            <span>Balance:</span>
            <AmountDisplay amount={invoice.balance || 0} variant={invoice.balance === 0 ? 'success' : invoice.balance > 0 ? 'destructive' : 'default'} className="font-bold" />
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
          </div>}
      </CardContent>
    </Card>;
};
export default InvoiceDetailView;
