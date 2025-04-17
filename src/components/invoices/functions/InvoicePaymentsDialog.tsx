
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { InvoiceWithAccount } from '@/types/invoices/invoice';
import { CreditCard, DollarSign } from 'lucide-react';
import { AmountDisplay } from '@/components/shared/AmountDisplay';

interface InvoicePaymentsDialogProps {
  invoice: InvoiceWithAccount;
  open: boolean;
  onClose: () => void;
}

interface Payment {
  id: string;
  payment_amount: number;
  date_of_payment: string;
  type_of_payment?: string;
  payment_note?: string;
  rowid_invoices: string;
  rowid_accounts: string;
  created_at: string;
  // For display purposes
  method?: string;
}

export const InvoicePaymentsDialog: React.FC<InvoicePaymentsDialogProps> = ({ invoice, open, onClose }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    if (open && invoice) {
      fetchPayments();
    }
  }, [open, invoice]);
  
  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('gl_customer_payments')
        .select('*')
        .eq('rowid_invoices', invoice.glide_row_id);
      
      if (error) throw error;
      
      // Enhance payment data for display
      const enhancedPayments = data.map(payment => ({
        ...payment,
        method: payment.type_of_payment || 'Other'
      }));
      
      setPayments(enhancedPayments);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setIsLoading(false);
    }
  };
  
  const invoiceNumber = invoice.invoice_uid || `INV-${invoice.id.substring(0, 6)}`;
  
  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payments for Invoice #{invoiceNumber}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col bg-gray-50 p-3 rounded">
              <span className="text-xs text-muted-foreground">Total Amount</span>
              <span className="font-medium">{formatCurrency(invoice.total_amount || 0)}</span>
            </div>
            
            <div className="flex flex-col bg-gray-50 p-3 rounded">
              <span className="text-xs text-muted-foreground">Paid</span>
              <span className="font-medium text-green-600">{formatCurrency(invoice.total_paid || 0)}</span>
            </div>
            
            <div className="flex flex-col bg-gray-50 p-3 rounded">
              <span className="text-xs text-muted-foreground">Balance</span>
              <span className={`font-medium ${invoice.balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {formatCurrency(invoice.balance || 0)}
              </span>
            </div>
          </div>
          
          {/* Payments Table */}
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center p-8 border rounded-md bg-gray-50">
              <DollarSign className="h-10 w-10 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">No payments recorded for this invoice.</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.date_of_payment)}</TableCell>
                      <TableCell>
                        <AmountDisplay amount={payment.payment_amount} variant="success" />
                      </TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell>{payment.payment_note || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
