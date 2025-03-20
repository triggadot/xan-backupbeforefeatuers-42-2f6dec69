
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceWithDetails, InvoiceFilters, InvoicePayment, AddPaymentInput } from '@/types/invoice';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useInvoicesNew(filters?: InvoiceFilters) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch invoices from the materialized view
  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('mv_invoice_customer_details')
        .select('*');
        
      if (error) throw error;
      
      return { data, error: null };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching invoices');
      return { data: null, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  // Get a single invoice with all related details
  const getInvoice = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get invoice details
      const { data: invoice, error: invoiceError } = await supabase
        .from('gl_invoices')
        .select(`
          *,
          account:rowid_accounts(*)
        `)
        .eq('id', id)
        .single();
        
      if (invoiceError) throw invoiceError;
      
      // Get invoice line items
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('gl_invoice_lines')
        .select(`
          *,
          productDetails:rowid_products(*)
        `)
        .eq('rowid_invoices', invoice.glide_row_id);
        
      if (lineItemsError) throw lineItemsError;
      
      // Get payments
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_customer_payments')
        .select('*')
        .eq('rowid_invoices', invoice.glide_row_id);
        
      if (paymentsError) throw paymentsError;
      
      // Format the result as InvoiceWithDetails
      return {
        id: invoice.id,
        invoiceNumber: invoice.glide_row_id || 'Unknown',
        glideRowId: invoice.glide_row_id,
        customerId: invoice.rowid_accounts,
        customerName: invoice.account?.account_name || 'Unknown Customer',
        date: new Date(invoice.invoice_order_date || invoice.created_at),
        dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
        status: invoice.payment_status || 'draft',
        total: Number(invoice.total_amount || 0),
        totalPaid: Number(invoice.total_paid || 0),
        balance: Number(invoice.balance || 0),
        notes: invoice.notes,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
        lineItems: lineItems.map(item => ({
          id: item.id,
          invoiceId: invoice.id,
          productId: item.rowid_products || '',
          description: item.renamed_product_name || '',
          productName: item.renamed_product_name || item.productDetails?.display_name || 'Unknown Product',
          quantity: Number(item.qty_sold || 0),
          unitPrice: Number(item.selling_price || 0),
          total: Number(item.line_total || 0),
          notes: item.product_sale_note,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          productDetails: item.productDetails
        })),
        payments: payments.map(payment => ({
          id: payment.id,
          invoiceId: invoice.id,
          accountId: payment.rowid_accounts || '',
          date: new Date(payment.date_of_payment || payment.created_at),
          amount: Number(payment.payment_amount || 0),
          method: payment.type_of_payment || '',
          notes: payment.payment_note || '',
          paymentDate: payment.date_of_payment || payment.created_at,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at
        }))
      };
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

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
        date: new Date(payment.date_of_payment || payment.created_at),
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

  // Delete a line item from an invoice
  const deleteLineItem = useMutation({
    mutationFn: async ({ id, invoiceId }: { id: string, invoiceId: string }) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
    }
  });

  // Delete an invoice
  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('gl_invoices')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return true;
      } catch (err) {
        console.error('Error deleting invoice:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });

  return {
    fetchInvoices,
    getInvoice,
    addPayment,
    deletePayment,
    deleteLineItem,
    deleteInvoice,
    isLoading,
    error
  };
}
