import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InvoiceWithAccount } from '@/types/new/invoice'; // Ensure correct type import
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { StatusBadge } from '@/components/common/StatusBadge';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';

interface UnpaidInvoicesTableProps {
  invoices: InvoiceWithAccount[];
}

/**
 * Table component to display open invoices (positive or negative balance)
 */
export const UnpaidInvoicesTable: React.FC<UnpaidInvoicesTableProps> = ({ invoices }) => {
  // Function to format date, handle null/undefined
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PP'); // Example: Jan 1, 2023
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice #</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Paid</TableHead>
          <TableHead className="text-right">Balance</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground">
              No open invoices found.
            </TableCell>
          </TableRow>
        ) : (
          invoices.map(invoice => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">
                <Link to={`/invoices/${invoice.id}`} className="text-blue-600 hover:underline">
                  {invoice.invoice_uid || invoice.id}
                </Link>
              </TableCell>
              <TableCell>{formatDate(invoice.invoice_order_date)}</TableCell>
              <TableCell className="text-right">
                <AmountDisplay amount={invoice.total_amount || 0} />
              </TableCell>
              <TableCell className="text-right">
                <AmountDisplay amount={invoice.total_paid || 0} />
              </TableCell>
              <TableCell className="text-right">
                <AmountDisplay amount={invoice.balance || 0} currency={invoice.balance !== 0 ? (invoice.balance < 0 ? 'USD' : 'USD') : undefined} colored />
              </TableCell>
              <TableCell>
                <StatusBadge status={invoice.payment_status as any} size="sm" />
              </TableCell>
              <TableCell>
                <Link to={`/invoices/${invoice.id}`} className="text-blue-600 hover:text-blue-800">
                  <Eye size={16} />
                </Link>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
