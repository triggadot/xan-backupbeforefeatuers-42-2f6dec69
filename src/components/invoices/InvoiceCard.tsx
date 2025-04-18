
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { InvoiceWithAccount } from '@/types/invoices/invoice';
import { Calendar, CreditCard, DollarSign, FileText } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

interface InvoiceCardProps {
  invoice: InvoiceWithAccount;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice }) => {
  // Derive invoice number from data following the existing format
  const invoiceNumber = invoice.invoice_uid || `INV-${invoice.id.substring(0, 6)}`;

  return (
    <Link to={`/invoices/${invoice.id}`}>
      <Card className="h-full overflow-hidden transition-all hover:shadow-md hover:border-primary/50">
        <CardHeader className="p-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{invoiceNumber}</span>
          </div>
          <InvoiceStatusBadge status={invoice.payment_status as any} size="sm" />
        </CardHeader>
        <CardContent className="p-4 pt-1 pb-0">
          <div className="space-y-2">
            <div className="text-lg font-semibold truncate">
              {invoice.account?.account_name || "No Customer"}
            </div>

            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(invoice.date_of_invoice)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 flex justify-between items-center border-t mt-3">
          <div className="flex items-center text-muted-foreground">
            <DollarSign className="h-4 w-4 mr-1" />
            <span className="text-sm">{formatCurrency(invoice.total_amount || 0)}</span>
          </div>
          {invoice.balance > 0 && (
            <div className="flex items-center text-sm text-amber-500">
              <CreditCard className="h-4 w-4 mr-1" />
              <span>{formatCurrency(invoice.balance)}</span>
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
};
