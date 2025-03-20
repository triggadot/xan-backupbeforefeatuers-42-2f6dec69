
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InvoicePayment, AddPaymentInput } from '@/types/invoice';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

export const useInvoices = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get a single invoice by ID
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
      
      // Format the result
      return {
        id: invoice.id,
        number: invoice.glide_row_id || 'Unknown',
        customerId: invoice.rowid_accounts,
        accountId: invoice.rowid_accounts,
        accountName: invoice.account?.account_name || 'Unknown Customer',
        date: new Date(invoice.invoice_order_date || invoice.created_at),
        dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
        status: invoice.payment_status || 'draft',
        total: Number(invoice.total_amount || 0),
        subtotal: Number(invoice.total_amount || 0), // If you don't have separate subtotal
        tax: 0, // If you don't track tax separately
        amountPaid: Number(invoice.total_paid || 0),
        balance: Number(invoice.balance || 0),
        notes: invoice.notes,
        lineItems: lineItems.map(item => ({
          id: item.id,
          productId: item.rowid_products || '',
          description: item.renamed_product_name || '',
          quantity: Number(item.qty_sold || 0),
          unitPrice: Number(item.selling_price || 0),
          total: Number(item.line_total || 0),
          productDetails: item.productDetails
        })),
        payments: payments.map(payment => ({
          id: payment.id,
          date: new Date(payment.date_of_payment || payment.created_at),
          amount: Number(payment.payment_amount || 0),
          method: payment.type_of_payment || '',
          notes: payment.payment_note || ''
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

  return {
    addPayment,
    getInvoice,
    isLoading,
    error
  };
};
