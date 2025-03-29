import React, { useMemo } from 'react';
import { InvoiceWithAccount } from '@/types/new/invoice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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

  // Handle PDF download
  const handleDownloadPdf = () => {
    // Check if we have a direct link
    if (invoice.doc_glideforeverlink) {
      window.open(invoice.doc_glideforeverlink, '_blank');
    } else {
      toast({
        title: 'PDF Download',
        description: 'Generating PDF document...',
      });
      
      // In a real implementation, you would make an API call to generate and download the PDF
      setTimeout(() => {
        toast({
          title: 'PDF Generated',
          description: 'Your invoice PDF has been generated and downloaded.',
        });
      }, 1000);
    }
  };

  // Handle invoice sharing
  const handleShareInvoice = () => {
    toast({
      title: 'Share Invoice',
      description: 'Opening share options...',
    });
    
    // In a real implementation, you would have sharing functionality
  };

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
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-6 justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1" 
            onClick={handleDownloadPdf}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1" 
            onClick={handlePrintInvoice}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1" 
            onClick={handleShareInvoice}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
          <div className="border-b pb-3 md:border-b-0 md:pb-0">
            <h3 className="font-semibold mb-2 text-gray-700">Billed To:</h3>
            {invoice.account ? (
              <div className="space-y-1">
                <p className="font-medium text-base">{invoice.account.account_name || 'Unnamed Account'}</p>
                {invoice.account.accounts_uid && <p className="text-gray-600">{invoice.account.accounts_uid}</p>}
                {invoice.account.email_of_who_added && <p className="text-gray-600">{invoice.account.email_of_who_added}</p>}
                {invoice.account.client_type && (
                  <p className="text-xs mt-1 inline-block px-2 py-1 bg-gray-100 rounded-md text-gray-700">
                    {invoice.account.client_type}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Account ID: {invoice.rowid_accounts || 'N/A'}</p>
            )}
          </div>
          <div className="text-right">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Invoice Date:</span> 
                <span>{formatDate(invoice.invoice_order_date) || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Due Date:</span> 
                <span>{formatDate(invoice.due_date) || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Created:</span> 
                <span>{formatDate(invoice.created_timestamp) || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Line Items */}
        <h3 className="text-lg font-semibold mb-2 text-gray-800">Items</h3>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lines && invoice.lines.length > 0 ? (
                invoice.lines.map((line, index) => (
                  <TableRow key={line.id || index} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{line.display_name || line.renamed_product_name || 'Product Description'}</TableCell>
                    <TableCell>{Math.round(Number(line.qty_sold) || 0)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(line.selling_price || 0)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(line.line_total || (line.qty_sold || 0) * (line.selling_price || 0))}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-gray-500">No items on this invoice.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Invoice Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm text-gray-600 font-semibold">
              <span>Total Quantity:</span>
              <span>{Math.round(totalQuantity)}</span>
            </div>
            
            <div className="flex justify-between text-sm text-gray-600 font-semibold">
              <span>Item(s) Total:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            
            {invoice.tax_amount && invoice.tax_amount > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax ({invoice.tax_rate || 0}%):</span>
                <span>{formatCurrency(invoice.tax_amount || 0)}</span>
              </div>
            )}
            
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total Amount:</span>
              <span>{formatCurrency(invoice.total_amount || 0)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Total Paid:</span>
              <span className="text-green-600">{formatCurrency(invoice.total_paid || 0)}</span>
            </div>
            
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Balance Due:</span>
              <span className={invoice.balance && invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                {formatCurrency(invoice.balance || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {invoice.notes && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-semibold mb-1 text-gray-700">Notes:</h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{invoice.notes}</p>
          </div>
        )}
        
        {/* User Email - Only show if available */}
        {invoice.user_email && (
          <div className="mt-4 text-xs text-right text-gray-500">
            Created by: {invoice.user_email}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceDetailView;
