import React, { useState } from 'react';
import { InvoiceWithAccount } from '@/types/new/invoice';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface UnpaidInvoicesTableProps {
  invoices: InvoiceWithAccount[];
}

/**
 * Displays a table of unpaid invoices with expandable rows to show line items
 */
export const UnpaidInvoicesTable: React.FC<UnpaidInvoicesTableProps> = ({ invoices }) => {
  const [expandedInvoices, setExpandedInvoices] = useState<Record<string, boolean>>({});

  const toggleExpand = (invoiceId: string) => {
    setExpandedInvoices(prev => ({
      ...prev,
      [invoiceId]: !prev[invoiceId]
    }));
  };

  const getStatusColor = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No unpaid invoices found for this account.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map(invoice => (
            <React.Fragment key={invoice.id}>
              <TableRow className="hover:bg-muted/50">
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => toggleExpand(invoice.id)}
                    className="h-8 w-8"
                  >
                    {expandedInvoices[invoice.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </Button>
                </TableCell>
                <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                <TableCell>{invoice.invoice_date ? format(new Date(invoice.invoice_date), 'MMM d, yyyy') : '-'}</TableCell>
                <TableCell>{invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`${getStatusColor(invoice.payment_status)}`}>
                    {invoice.payment_status || 'Pending'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <AmountDisplay amount={invoice.total_amount || 0} />
                </TableCell>
                <TableCell className="text-right">
                  <AmountDisplay 
                    amount={invoice.balance || 0} 
                    variant={invoice.balance === 0 ? 'success' : 'destructive'} 
                  />
                </TableCell>
                <TableCell>
                  <Link to={`/invoices/${invoice.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink size={16} />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
              
              {/* Expanded line items */}
              {expandedInvoices[invoice.id] && invoice.lines && invoice.lines.length > 0 && (
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={8} className="p-0">
                    <div className="px-4 py-2">
                      <h4 className="text-sm font-medium mb-2">Line Items</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>UID</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoice.lines.map((line, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono text-xs">
                                {line.glide_row_id?.substring(0, 8) || `INV-${index}`}
                              </TableCell>
                              <TableCell>{line.product_name || 'Custom Item'}</TableCell>
                              <TableCell>{line.description}</TableCell>
                              <TableCell className="text-right">{line.qty_sold}</TableCell>
                              <TableCell className="text-right">
                                <AmountDisplay amount={line.unit_price || 0} />
                              </TableCell>
                              <TableCell className="text-right">
                                <AmountDisplay amount={(line.qty_sold || 0) * (line.unit_price || 0)} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
