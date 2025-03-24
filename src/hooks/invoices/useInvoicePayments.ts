
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InvoicePayment } from '@/types/invoice';
import { useToast } from '@/hooks/use-toast';

export function useInvoicePayments() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const addPayment = {
    mutateAsync: async ({ invoiceGlideId, data }: { invoiceGlideId: string, data: Partial<InvoicePayment> }): Promise<InvoicePayment | null> => {
      setIsLoading(true);
      setError(null);
      
      try {
        const paymentData = {
          rowid_invoices: invoiceGlideId,
          rowid_accounts: data.accountId,
          payment_amount: data.amount,
          date_of_payment: data.paymentDate,
          type_of_payment: data.paymentMethod,
          payment_note: data.notes
        };
        
        const { data: newPayment, error: createError } = await supabase
          .from('gl_customer_payments')
          .insert([paymentData])
          .select()
          .single();
          
        if (createError) throw createError;
        
        // Update the invoice total
        await updateInvoiceTotal(invoiceGlideId);
        
        toast({
          title: 'Success',
          description: 'Payment added successfully.',
        });
        
        return newPayment as unknown as InvoicePayment;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error adding payment';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    }
  };

  const updatePayment = {
    mutateAsync: async ({ id, data }: { id: string, data: Partial<InvoicePayment> }): Promise<InvoicePayment | null> => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get the current payment to access the invoice ID
        const { data: currentPayment, error: fetchError } = await supabase
          .from('gl_customer_payments')
          .select('*')
          .eq('id', id)
          .single();
          
        if (fetchError) throw fetchError;
        
        const paymentData = {
          rowid_accounts: data.accountId,
          payment_amount: data.amount,
          date_of_payment: data.paymentDate,
          type_of_payment: data.paymentMethod,
          payment_note: data.notes
        };
        
        // Update the payment
        const { data: updatedPayment, error: updateError } = await supabase
          .from('gl_customer_payments')
          .update(paymentData)
          .eq('id', id)
          .select()
          .single();
          
        if (updateError) throw updateError;
        
        // Update the invoice total
        await updateInvoiceTotal(currentPayment.rowid_invoices);
        
        toast({
          title: 'Success',
          description: 'Payment updated successfully.',
        });
        
        return updatedPayment as unknown as InvoicePayment;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error updating payment';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    }
  };

  const deletePayment = {
    mutateAsync: async ({ id }: { id: string }): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get the current payment to access the invoice ID
        const { data: payment, error: fetchError } = await supabase
          .from('gl_customer_payments')
          .select('rowid_invoices')
          .eq('id', id)
          .single();
          
        if (fetchError) throw fetchError;
        
        // Delete the payment
        const { error: deleteError } = await supabase
          .from('gl_customer_payments')
          .delete()
          .eq('id', id);
          
        if (deleteError) throw deleteError;
        
        // Update the invoice total
        await updateInvoiceTotal(payment.rowid_invoices);
        
        toast({
          title: 'Success',
          description: 'Payment deleted successfully.',
        });
        
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error deleting payment';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Helper function to update invoice totals
  const updateInvoiceTotal = async (invoiceGlideId: string) => {
    try {
      // Calculate total from line items
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('gl_invoice_lines')
        .select('line_total')
        .eq('rowid_invoices', invoiceGlideId);
        
      if (lineItemsError) throw lineItemsError;
      
      const total = lineItems.reduce((sum, item) => sum + (parseFloat(item.line_total) || 0), 0);
      
      // Get total payments
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_customer_payments')
        .select('payment_amount')
        .eq('rowid_invoices', invoiceGlideId);
        
      if (paymentsError) throw paymentsError;
      
      const totalPaid = payments.reduce((sum, payment) => sum + (parseFloat(payment.payment_amount) || 0), 0);
      
      // Calculate payment status
      let paymentStatus = 'draft';
      if (totalPaid === 0) {
        paymentStatus = 'sent';
      } else if (totalPaid >= total) {
        paymentStatus = 'paid';
      } else if (totalPaid > 0 && totalPaid < total) {
        paymentStatus = 'partial';
      }
      
      // Update invoice with new totals
      const { error: updateError } = await supabase
        .from('gl_invoices')
        .update({
          total_amount: total,
          total_paid: totalPaid,
          balance: total - totalPaid,
          payment_status: paymentStatus,
          processed: true // Set invoice as processed if we're recording payments
        })
        .eq('glide_row_id', invoiceGlideId);
        
      if (updateError) throw updateError;
      
    } catch (err) {
      console.error('Error updating invoice total:', err);
    }
  };

  return {
    addPayment,
    updatePayment,
    deletePayment,
    isLoading,
    error
  };
}
