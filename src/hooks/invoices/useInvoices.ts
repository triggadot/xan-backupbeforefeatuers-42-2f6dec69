
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { InvoicePayment, AddPaymentInput } from '@/types/invoice';

export function useInvoices() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('gl_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return { data: [], error: err };
    } finally {
      setIsLoading(false);
    }
  };

  const addPayment = {
    mutateAsync: async (paymentData: AddPaymentInput) => {
      try {
        const { data, error } = await supabase
          .from('gl_customer_payments')
          .insert({
            rowid_invoices: paymentData.invoiceId,
            main_payment_amount: paymentData.amount,
            date_of_payment: paymentData.paymentDate,
            payment_method: paymentData.paymentMethod,
            notes: paymentData.notes,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: 'Payment Added',
          description: 'Payment has been recorded successfully.',
        });

        return data;
      } catch (err) {
        console.error('Error adding payment:', err);
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to record payment',
          variant: 'destructive',
        });
        throw err;
      }
    }
  };

  const deletePayment = {
    mutateAsync: async ({ id, invoiceId }: { id: string, invoiceId: string }) => {
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
    }
  };

  const deleteLineItem = {
    mutateAsync: async ({ id, invoiceId }: { id: string, invoiceId: string }) => {
      try {
        const { error } = await supabase
          .from('gl_invoice_lines')
          .delete()
          .eq('id', id);

        if (error) throw error;

        toast({
          title: 'Line Item Deleted',
          description: 'Line item has been deleted successfully.',
        });

        return true;
      } catch (err) {
        console.error('Error deleting line item:', err);
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to delete line item',
          variant: 'destructive',
        });
        throw err;
      }
    }
  };

  return {
    fetchInvoices,
    addPayment,
    deletePayment,
    deleteLineItem,
    isLoading,
    error
  };
}
