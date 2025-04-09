import React from 'react';
import { CustomerPayment } from '@/hooks/accounts/useAccountOverview';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Receipt } from 'lucide-react';

interface PaymentsTableProps {
  payments: CustomerPayment[];
}

/**
 * Displays a table of customer payments
 */
export const PaymentsTable: React.FC<PaymentsTableProps> = ({ payments }) => {
  const getPaymentMethodIcon = (method?: string) => {
    switch (method?.toLowerCase()) {
      case 'credit card':
      case 'card':
        return <CreditCard className="h-4 w-4 mr-1" />;
      default:
        return <Receipt className="h-4 w-4 mr-1" />;
    }
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No payments found for this account.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map(payment => (
            <TableRow key={payment.id} className="hover:bg-muted/50">
              <TableCell>
                {payment.payment_date ? format(new Date(payment.payment_date), 'MMM d, yyyy') : '-'}
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  {getPaymentMethodIcon(payment.payment_method)}
                  <span>{payment.payment_method || 'Other'}</span>
                </div>
              </TableCell>
              <TableCell className="max-w-md truncate">
                {payment.notes || '-'}
              </TableCell>
              <TableCell className="text-right">
                <AmountDisplay 
                  amount={payment.payment_amount || 0} 
                  variant="success" 
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
