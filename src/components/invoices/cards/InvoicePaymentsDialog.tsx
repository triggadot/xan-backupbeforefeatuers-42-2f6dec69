
import React from 'react';
import { InvoiceWithAccount } from '@/types/new/invoice';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInvoicePayments } from '@/hooks/invoices/useInvoicePayments';
import { useState, useEffect } from 'react';
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface InvoicePaymentsDialogProps {
  invoice: InvoiceWithAccount;
  open: boolean;
  onClose: () => void;
}

interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  notes?: string;
}

export const InvoicePaymentsDialog: React.FC<InvoicePaymentsDialogProps> = ({ 
  invoice, 
  open, 
  onClose 
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPayments = async () => {
      if (!open) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch payments related to this invoice from Supabase
        const { supabase } = await import('@/integrations/supabase/client');
        
        const { data, error } = await supabase
          .from('gl_customer_payments')
          .select('*')
          .eq('rowid_invoices', invoice.glide_row_id);
          
        if (error) throw error;
        
        // Format the payments data
        const formattedPayments = data.map(payment => ({
          id: payment.id,
          date: payment.date_of_payment,
          amount: Number(payment.payment_amount) || 0,
          method: payment.type_of_payment || 'Unknown',
          notes: payment.payment_note
        }));
        
        setPayments(formattedPayments);
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError('Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPayments();
  }, [open, invoice.glide_row_id]);
  
  // Calculate total paid
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const isPaidInFull = totalPaid >= (invoice.total_amount || 0);
  const invoiceNumber = invoice.invoice_uid || `INV-${invoice.id.substring(0, 6)}`;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History
          </DialogTitle>
          <DialogDescription>
            Showing payments for invoice #{invoiceNumber}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
            <p className="text-lg font-bold">{formatCurrency(invoice.total_amount || 0)}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Paid</p>
            <p className={`text-lg font-bold ${isPaidInFull ? 'text-emerald-600' : 'text-amber-500'}`}>
              {formatCurrency(totalPaid)}
            </p>
          </Card>
        </div>
        
        {isPaidInFull && (
          <div className="bg-emerald-50 text-emerald-800 rounded-md p-3 flex items-center gap-2 text-sm mb-4">
            <CheckCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Paid in full</p>
              <p className="text-xs">This invoice has been fully paid</p>
            </div>
          </div>
        )}
        
        {!isPaidInFull && invoice.total_amount > 0 && (
          <div className="bg-amber-50 text-amber-800 rounded-md p-3 flex items-center gap-2 text-sm mb-4">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Outstanding Balance</p>
              <p className="text-xs">Remaining: {formatCurrency((invoice.total_amount || 0) - totalPaid)}</p>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-800 rounded-md p-4 text-center">
              <AlertCircle className="h-5 w-5 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No payments have been recorded for this invoice</p>
            </div>
          ) : (
            <ScrollArea className="h-[280px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {payment.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
