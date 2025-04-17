import React, { useState } from 'react';
import { InvoiceWithAccount } from '@/types/invoices/invoice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CalendarIcon, FileTextIcon, ArrowLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PDFActions } from '@/components/pdf/PDFActions';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';
import { Link } from 'react-router-dom';
import { usePDF } from '@/hooks/pdf/usePDF';
import { DocumentType } from '@/types/documents/pdf.unified';
import { AmountDisplay } from '@/components/shared/AmountDisplay';

interface InvoiceCardDetailProps {
  invoice: InvoiceWithAccount;
}

export const InvoiceCardDetail: React.FC<InvoiceCardDetailProps> = ({ invoice }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const { generatePDF } = usePDF();

  // Calculate subtotal if tax information is available
  const subtotal = invoice.total_amount || 0;

  // Calculate item count
  const itemCount = invoice.lines?.length || 0;

  // Format invoice number
  const invoiceNumber = invoice.invoice_uid || `INV-${invoice.id.substring(0, 6)}`;

  return (
    <div className="space-y-6">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <Link to="/invoices">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
      </div>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileTextIcon className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Invoice #{invoiceNumber}</CardTitle>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span className="text-sm">{formatDate(invoice.date_of_invoice/span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <InvoiceStatusBadge status={invoice.payment_status as any} />
            <PDFActions
              documentType={DocumentType.INVOICE}
              document={invoice}
              variant="outline"
              size="sm"
              showLabels={true}
              onPDFGenerated={url => setPdfUrl(url)}
            />
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Customer Information */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Customer</h3>
              <p className="font-medium">{invoice.account?.account_name || 'No Customer'}</p>
              {invoice.account?.accounts_uid && (
                <p className="text-sm text-muted-foreground">{invoice.account.accounts_uid}</p>
              )}
            </div>
            <div className="text-right">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Amount</h3>
              <p className="text-xl font-bold">{formatCurrency(invoice.total_amount || 0)}</p>
              <div className="text-sm">
                <span className={invoice.balance <= 0 ? 'text-green-500' : 'text-red-500'}>
                  {invoice.balance <= 0 ? 'Paid in Full' : `Balance: ${formatCurrency(invoice.balance)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="overflow-x-auto mt-6">
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
                      <TableCell className="font-medium">
                        {line.renamed_product_name || 'Unnamed Product'}
                      </TableCell>
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
              <span className="text-gray-500 font-medium">
                Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})
              </span>
              <AmountDisplay amount={subtotal} />
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Paid</span>
              <AmountDisplay amount={invoice.total_paid || 0} variant={invoice.total_paid ? 'success' : 'default'} />
            </div>

            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Balance</span>
              <AmountDisplay
                amount={invoice.balance || 0}
                variant={invoice.balance === 0 ? 'success' : invoice.balance > 0 ? 'destructive' : 'default'}
                className="font-bold"
              />
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
