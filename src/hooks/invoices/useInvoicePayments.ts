
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { InvoicePayment, AddPaymentInput } from '@/types/invoice';

export function useInvoicePayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Add a payment to an invoice
  const addPayment = useMutation({
    mutationFn: async (paymentData: AddPaymentInput): Promise<InvoicePayment> => {
      // Create a new payment record
      const { data: payment, error } = await supabase
        .from('gl_customer_payments')
        .insert({
          glide_row_id: `payment-${Date.now()}`, // Generate a unique ID
          rowid_invoices: paymentData.invoiceId,
          rowid_accounts: paymentData.accountId,
          payment_amount: paymentData.amount,
          date_of_payment: paymentData.paymentDate.toISOString(),
          type_of_payment: paymentData.paymentMethod || '',
          payment_note: paymentData.notes || ''
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding payment:', error);
        throw new Error(`Failed to add payment: ${error.message}`);
      }

      // Update the invoice status based on the remaining balance
      // This would typically be handled by a trigger, but we'll do it manually for now
      const { data: invoice, error: invoiceError } = await supabase
        .from('gl_invoices')
        .select('total_amount, balance')
        .eq('id', paymentData.invoiceId)
        .single();

      if (invoiceError) {
        console.error('Error getting invoice data:', invoiceError);
      } else {
        // Calculate the new balance
        const currentBalance = Number(invoice.balance || 0);
        const newBalance = Math.max(0, currentBalance - paymentData.amount);
        const newStatus = newBalance <= 0 ? 'paid' : newBalance < Number(invoice.total_amount) ? 'partial' : 'unpaid';

        // Update the invoice status and balance
        const { error: updateError } = await supabase
          .from('gl_invoices')
          .update({
            balance: newBalance,
            payment_status: newStatus
          })
          .eq('id', paymentData.invoiceId);

        if (updateError) {
          console.error('Error updating invoice status:', updateError);
        }
      }

      // Format the result (convert string dates to Date objects)
      return {
        id: payment.id,
        invoiceId: payment.rowid_invoices,
        accountId: payment.rowid_accounts,
        amount: Number(payment.payment_amount),
        paymentDate: new Date(payment.date_of_payment || payment.created_at),
        paymentMethod: payment.type_of_payment || '',
        notes: payment.payment_note || '',
        createdAt: new Date(payment.created_at),
        updatedAt: new Date(payment.updated_at)
      };
    },
    onSuccess: () => {
      toast({
        title: 'Payment Added',
        description: 'The payment has been recorded successfully.',
      });
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });

  // Delete a payment record
  const deletePayment = useMutation({
    mutationFn: async ({ id, invoiceId }: { id: string, invoiceId: string }) => {
      try {
        const { error } = await supabase
          .from('gl_customer_payments')
          .delete()
          .eq('id', id);

        if (error) throw error;

        toast({
          title: 'Payment Deleted',
          description: 'Payment has been deleted successfully.',
        });

        return true;
      } catch (err) {
        console.error('Error deleting payment:', err);
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to delete payment',
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
    }
  });

  return {
    addPayment,
    deletePayment
  };
}
