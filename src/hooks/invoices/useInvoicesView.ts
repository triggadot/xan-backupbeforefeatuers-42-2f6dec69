
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  InvoiceWithDetails, 
  InvoiceLineItem, 
  InvoicePayment, 
  ProductDetails 
} from '@/types/invoiceView';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const isValidProductDetails = (productDetails: any): productDetails is ProductDetails => {
  return productDetails && 
         typeof productDetails === 'object' && 
         productDetails !== null &&
         !('error' in productDetails);
};

export function useInvoicesView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: refreshError } = await supabase.rpc('refresh_materialized_view_secure', {
        view_name: 'mv_invoice_customer_details'
      });
      
      if (refreshError) {
        console.warn('Could not refresh materialized view:', refreshError.message);
      }
      
      // First query the invoice data
      const { data, error } = await supabase
        .from('mv_invoice_customer_details')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Then get the line item counts separately
      const mappedInvoices = await Promise.all(data.map(async (invoice) => {
        // Get line items count for this invoice
        const { count, error: countError } = await supabase
          .from('gl_invoice_lines')
          .select('*', { count: 'exact', head: true })
          .eq('rowid_invoices', invoice.glide_row_id);
          
        const lineItemsCount = countError ? 0 : (count || 0);
        
        return {
          id: invoice.invoice_id,
          invoiceNumber: invoice.glide_row_id || 'Unknown',
          glideRowId: invoice.glide_row_id,
          customerId: invoice.customer_id,
          customerName: invoice.customer_name,
          date: new Date(invoice.invoice_order_date || invoice.created_at),
          total: Number(invoice.total_amount),
          balance: Number(invoice.balance),
          status: invoice.payment_status || 'draft',
          lineItemsCount: lineItemsCount,
          notes: invoice.notes,
        };
      }));
      
      return mappedInvoices;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoices';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getInvoice = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: refreshError } = await supabase.rpc('refresh_materialized_view_secure', {
        view_name: 'mv_invoice_customer_details'
      });
      
      if (refreshError) {
        console.warn('Could not refresh materialized view:', refreshError.message);
      }
      
      const { data: invoice, error: invoiceError } = await supabase
        .from('mv_invoice_customer_details')
        .select('*')
        .eq('invoice_id', id)
        .single();
        
      if (invoiceError) throw invoiceError;
      
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('gl_invoice_lines')
        .select(`
          *,
          product:rowid_products(*)
        `)
        .eq('rowid_invoices', invoice.glide_row_id);
        
      if (lineItemsError) throw lineItemsError;
      
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_customer_payments')
        .select('*')
        .eq('rowid_invoices', invoice.glide_row_id);
        
      if (paymentsError) throw paymentsError;
      
      const mappedLineItems: InvoiceLineItem[] = lineItems.map(item => {
        let productDetails: ProductDetails | null = null;
        
        if (isValidProductDetails(item.product)) {
          productDetails = {
            id: item.product.id || '',
            glide_row_id: item.product.glide_row_id || '',
            name: item.product.display_name || item.product.vendor_product_name || 'Unknown Product',
            display_name: item.product.display_name,
            vendor_product_name: item.product.vendor_product_name,
            new_product_name: item.product.new_product_name,
            cost: item.product.cost,
            category: item.product.category,
            product_image1: item.product.product_image1
          };
        }
        
        return {
          id: item.id,
          invoiceId: invoice.invoice_id,
          productId: item.rowid_products || '',
          description: item.renamed_product_name || '',
          productName: item.renamed_product_name || (productDetails?.name || 'Unknown Product'),
          quantity: Number(item.qty_sold || 0),
          unitPrice: Number(item.selling_price || 0),
          total: Number(item.line_total || 0),
          notes: item.product_sale_note,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          productDetails
        };
      });
      
      const mappedPayments: InvoicePayment[] = payments.map(payment => ({
        id: payment.id,
        invoiceId: invoice.invoice_id,
        accountId: payment.rowid_accounts || invoice.customer_id,
        date: new Date(payment.date_of_payment || payment.created_at),
        amount: Number(payment.payment_amount || 0),
        paymentMethod: payment.type_of_payment,
        notes: payment.payment_note,
        paymentDate: payment.date_of_payment || payment.created_at,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at
      }));

      const invoiceWithDetails: InvoiceWithDetails = {
        id: invoice.invoice_id,
        invoiceNumber: invoice.glide_row_id || 'Unknown',
        glideRowId: invoice.glide_row_id,
        customerId: invoice.customer_id,
        customerName: invoice.customer_name,
        date: new Date(invoice.invoice_order_date || invoice.created_at),
        dueDate: undefined,
        invoiceDate: new Date(invoice.invoice_order_date || invoice.created_at),
        subtotal: Number(invoice.total_amount || 0),
        total: Number(invoice.total_amount || 0),
        totalPaid: Number(invoice.total_paid || 0),
        balance: Number(invoice.balance || 0),
        amountPaid: Number(invoice.total_paid || 0),
        status: (invoice.payment_status as "draft" | "paid" | "partial" | "sent" | "overdue") || "draft",
        notes: invoice.notes,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
        lineItems: mappedLineItems,
        payments: mappedPayments
      };
      
      return invoiceWithDetails;
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const addPayment = useMutation({
    mutationFn: async (paymentData: {
      invoiceId: string;
      glideRowId: string;
      accountId: string;
      amount: number;
      paymentDate: Date;
      paymentMethod?: string;
      notes?: string;
    }) => {
      const { data: payment, error } = await supabase
        .from('gl_customer_payments')
        .insert({
          glide_row_id: `payment-${Date.now()}`,
          rowid_invoices: paymentData.glideRowId,
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

      return payment;
    },
    onSuccess: () => {
      toast({
        title: 'Payment Added',
        description: 'The payment has been recorded successfully.',
      });
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

  const deletePayment = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
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

  const deleteLineItem = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
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
    addPayment: useMutation({
      mutationFn: async (paymentData: any) => {
        const { error } = await supabase
          .from('gl_customer_payments')
          .insert({
            glide_row_id: `payment-${Date.now()}`,
            rowid_invoices: paymentData.glideRowId,
            rowid_accounts: paymentData.accountId,
            payment_amount: paymentData.amount,
            date_of_payment: paymentData.paymentDate.toISOString(),
            type_of_payment: paymentData.paymentMethod || '',
            payment_note: paymentData.notes || ''
          });
    
        if (error) throw error;
      },
      onSuccess: () => {
        toast({ title: 'Payment Added', description: 'The payment has been recorded successfully.' });
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
    }),
    deletePayment: useMutation({
      mutationFn: async ({ id }: { id: string }) => {
        const { error } = await supabase.from('gl_customer_payments').delete().eq('id', id);
        if (error) throw error;
        return true;
      },
      onSuccess: () => {
        toast({ title: 'Payment Deleted', description: 'Payment has been deleted successfully.' });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['invoice'] });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to delete payment',
          variant: 'destructive',
        });
      }
    }),
    deleteLineItem: useMutation({
      mutationFn: async ({ id }: { id: string }) => {
        const { error } = await supabase.from('gl_invoice_lines').delete().eq('id', id);
        if (error) throw error;
        return true;
      },
      onSuccess: () => {
        toast({ title: 'Line Item Deleted', description: 'Line item has been deleted successfully.' });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['invoice'] });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to delete line item',
          variant: 'destructive',
        });
      }
    }),
    deleteInvoice: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from('gl_invoices').delete().eq('id', id);
        if (error) throw error;
        return true;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      }
    }),
    isLoading,
    error
  };
}
