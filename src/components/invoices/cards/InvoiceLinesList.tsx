
import React from 'react';
import { InvoiceWithAccount } from '@/types/invoices/invoice';
import { formatCurrency } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PackageOpen } from 'lucide-react';

interface InvoiceLinesListProps {
  invoice: InvoiceWithAccount;
}

export const InvoiceLinesList: React.FC<InvoiceLinesListProps> = ({ invoice }) => {
  const hasLines = invoice.lines && invoice.lines.length > 0;
  
  if (!hasLines) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <PackageOpen className="h-8 w-8 mb-2 text-muted-foreground/50" />
        <p>No line items found for this invoice</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h4 className="text-sm font-medium mb-2">Invoice Items</h4>
      <ScrollArea className="h-[200px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right w-20">Qty</TableHead>
              <TableHead className="text-right w-24">Price</TableHead>
              <TableHead className="text-right w-24">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.lines.map((line, index) => (
              <TableRow key={line.id || index}>
                <TableCell className="font-medium">
                  {line.renamed_product_name || line.display_name || 'Unnamed Product'}
                </TableCell>
                <TableCell className="text-right">{line.qty_sold || 0}</TableCell>
                <TableCell className="text-right">{formatCurrency(line.selling_price || 0)}</TableCell>
                <TableCell className="text-right">{formatCurrency(line.line_total || 0)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      <div className="mt-4 flex justify-between text-sm">
        <span className="font-medium">Total</span>
        <span className="font-bold">{formatCurrency(invoice.total_amount || 0)}</span>
      </div>
    </div>
  );
};
