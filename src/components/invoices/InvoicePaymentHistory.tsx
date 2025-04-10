import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { InvoicePayment } from '@/types/invoice';

interface InvoicePaymentHistoryProps {
  payments: InvoicePayment[];
  invoiceTotal: number;
}

export function InvoicePaymentHistory({ payments, invoiceTotal }: InvoicePaymentHistoryProps) {
  // Calculate totals
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = invoiceTotal - totalPaid;
  const isFullyPaid = remainingBalance <= 0;
  const isPartiallyPaid = totalPaid > 0 && remainingBalance > 0;
  
  // Get payment status
  const getPaymentStatus = () => {
    if (isFullyPaid) return 'paid';
    if (isPartiallyPaid) return 'partial';
    return 'unpaid';
  };
  
  // Determine badge color based on payment status
  const getBadgeVariant = () => {
    switch (getPaymentStatus()) {
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      case 'unpaid':
        return 'destructive';
      default:
        return 'secondary';
    }
  };
  
  // Format payment status for display
  const getPaymentStatusText = () => {
    switch (getPaymentStatus()) {
      case 'paid':
        return 'Paid';
      case 'partial':
        return 'Partially Paid';
      case 'unpaid':
        return 'Unpaid';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-muted/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Transaction history for this invoice</CardDescription>
          </div>
          <Badge variant={getBadgeVariant() as any}>
            {getPaymentStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {payments.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No payment records found for this invoice.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{payment.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="p-4 border-t">
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Total:</span>
                  <span>{formatCurrency(invoiceTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Paid:</span>
                  <span>{formatCurrency(totalPaid)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Remaining Balance:</span>
                  <span>{formatCurrency(remainingBalance)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 