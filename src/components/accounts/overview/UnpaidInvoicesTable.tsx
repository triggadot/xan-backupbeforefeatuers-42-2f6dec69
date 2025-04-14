import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * @deprecated This is a temporary placeholder component.
 * The original component had TypeScript errors and will be rebuilt in a future update.
 */
interface UnpaidInvoicesTableProps {
  invoices: any[];
}

const UnpaidInvoicesTable: React.FC<UnpaidInvoicesTableProps> = ({ invoices }) => {
  // Simplified component that doesn't use the problematic AmountDisplay component
  return (
    <Card>
      <CardHeader>
        <CardTitle>Unpaid Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="py-4 text-sm text-center text-muted-foreground">
            No unpaid invoices found.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoice_uid || invoice.id}
                  </TableCell>
                  <TableCell>
                    {invoice.invoice_order_date ? new Date(invoice.invoice_order_date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    ${(invoice.balance || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-block px-2 py-1 text-xs text-gray-800 bg-gray-100 rounded-full">
                      {invoice.payment_status || 'Unknown'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default UnpaidInvoicesTable;
