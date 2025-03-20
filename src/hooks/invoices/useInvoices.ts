
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InvoicePayment, AddPaymentInput } from '@/types/invoice';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useInvoices = () => {
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

      // Format the result
      return {
        id: payment.id,
        invoiceId: payment.rowid_invoices,
        accountId: payment.rowid_accounts,
        amount: Number(payment.payment_amount),
        paymentDate: new Date(payment.date_of_payment || payment.created_at),
        paymentMethod: payment.type_of_payment || '',
        notes: payment.payment_note || '',
        date: new Date(payment.date_of_payment || payment.created_at),
        createdAt: payment.created_at,
        updatedAt: payment.updated_at
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

  return {
    addPayment
  };
};
