
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InvoiceListItem, InvoiceWithDetails } from '@/types/invoiceView';
import { InvoicePayment, InvoiceLineItem } from '@/types/invoice';

export function useInvoicesView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch invoices (list view)
  const fetchInvoices = async (): Promise<InvoiceListItem[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('mv_invoice_customer_details')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Map database results to frontend model
      return data.map(item => ({
        id: item.invoice_id,
        invoiceNumber: item.glide_row_id || `INV-${item.invoice_id.substring(0, 8)}`,
        glideRowId: item.glide_row_id || '',
        customerId: item.customer_id || '',
        customerName: item.customer_name || 'Unknown Customer',
        date: new Date(item.invoice_order_date || item.created_at),
        dueDate: item.due_date ? new Date(item.due_date) : undefined,
        total: Number(item.total_amount || 0),
        amountPaid: Number(item.total_paid || 0),
        balance: Number(item.balance || 0),
        status: item.payment_status || 'draft',
        lineItemsCount: item.line_items_count || 0,
        notes: item.notes || '',
        accountName: item.customer_name || 'Unknown Customer',
        lineItems: []
      }));
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Unknown error fetching invoices');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch single invoice with details
  const getInvoice = async (id: string): Promise<InvoiceWithDetails | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from('gl_invoices')
        .select(`
          *,
          customer:rowid_accounts(*)
        `)
        .eq('id', id)
        .single();
        
      if (invoiceError) throw invoiceError;
      
      // Get line items
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('gl_invoice_lines')
        .select(`
          *,
          product:rowid_products(*)
        `)
        .eq('rowid_invoices', invoice.glide_row_id);
        
      if (lineItemsError) throw lineItemsError;
      
      // Get payments
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_customer_payments')
        .select('*')
        .eq('rowid_invoices', invoice.glide_row_id);
        
      if (paymentsError) throw paymentsError;
      
      // Extract customer data safely
      const customerName = invoice.customer?.account_name || 'Unknown Customer';
      
      // Format results
      const formattedLineItems = lineItems.map(item => ({
        id: item.id,
        invoiceId: item.rowid_invoices,
        productId: item.rowid_products || '',
        description: item.renamed_product_name || '',
        productName: item.renamed_product_name || '',
        quantity: Number(item.qty_sold || 0),
        unitPrice: Number(item.selling_price || 0),
        total: Number(item.line_total || 0),
        notes: item.product_sale_note || '',
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        productDetails: item.product
      }));
      
      const formattedPayments = payments.map(payment => ({
        id: payment.id,
        invoiceId: payment.rowid_invoices,
        accountId: payment.rowid_accounts || '',
        date: new Date(payment.date_of_payment || payment.created_at),
        amount: Number(payment.payment_amount || 0),
        paymentMethod: payment.type_of_payment || 'Payment',
        notes: payment.payment_note || '',
        paymentDate: payment.date_of_payment || payment.created_at,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at
      }));
      
      return {
        id: invoice.id,
        invoiceNumber: invoice.glide_row_id || `INV-${invoice.id.substring(0, 8)}`,
        glideRowId: invoice.glide_row_id || '',
        customerId: invoice.rowid_accounts || '',
        customerName: customerName,
        date: new Date(invoice.invoice_order_date || invoice.created_at),
        dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
        invoiceDate: new Date(invoice.invoice_order_date || invoice.created_at),
        total: Number(invoice.total_amount || 0),
        totalPaid: Number(invoice.total_paid || 0),
        total_amount: Number(invoice.total_amount || 0),
        total_paid: Number(invoice.total_paid || 0),
        balance: Number(invoice.balance || 0),
        amountPaid: Number(invoice.total_paid || 0),
        subtotal: Number(invoice.total_amount || 0),
        status: invoice.payment_status || 'draft',
        notes: invoice.notes || '',
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
        lineItems: formattedLineItems,
        payments: formattedPayments
      };
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      setError(err instanceof Error ? err.message : 'Unknown error fetching invoice details');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete invoice
  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gl_invoices')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Invoice Deleted',
        description: 'Invoice has been deleted successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete invoice',
        variant: 'destructive'
      });
    }
  });

  // Add payment
  const addPayment = useMutation({
    mutationFn: async ({ invoiceGlideId, data }: { invoiceGlideId: string, data: Partial<InvoicePayment> }) => {
      const { error } = await supabase
        .from('gl_customer_payments')
        .insert({
          glide_row_id: `PAYMENT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          rowid_invoices: invoiceGlideId,
          rowid_accounts: data.accountId,
          payment_amount: data.amount,
          date_of_payment: data.paymentDate instanceof Date ? data.paymentDate.toISOString() : data.paymentDate,
          type_of_payment: data.paymentMethod,
          payment_note: data.notes
        });
        
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Payment Added',
        description: 'Payment has been recorded successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add payment',
        variant: 'destructive'
      });
    }
  });

  // Update payment
  const updatePayment = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<InvoicePayment> }) => {
      const { error } = await supabase
        .from('gl_customer_payments')
        .update({
          rowid_accounts: data.accountId,
          payment_amount: data.amount,
          date_of_payment: data.paymentDate instanceof Date ? data.paymentDate.toISOString() : data.paymentDate,
          type_of_payment: data.paymentMethod,
          payment_note: data.notes
        })
        .eq('id', id);
        
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Payment Updated',
        description: 'Payment has been updated successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update payment',
        variant: 'destructive'
      });
    }
  });

  // Delete payment
  const deletePayment = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from('gl_customer_payments')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Payment Deleted',
        description: 'Payment has been deleted successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete payment',
        variant: 'destructive'
      });
    }
  });

  // Add line item
  const addLineItem = useMutation({
    mutationFn: async ({ invoiceGlideId, data }: { invoiceGlideId: string, data: Partial<InvoiceLineItem> }) => {
      const { error } = await supabase
        .from('gl_invoice_lines')
        .insert({
          glide_row_id: `INVLINE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          rowid_invoices: invoiceGlideId,
          rowid_products: data.productId,
          renamed_product_name: data.description,
          qty_sold: data.quantity,
          selling_price: data.unitPrice,
          line_total: (data.quantity || 0) * (data.unitPrice || 0),
          product_sale_note: data.notes
        });
        
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Line Item Added',
        description: 'Line item has been added successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add line item',
        variant: 'destructive'
      });
    }
  });

  // Update line item
  const updateLineItem = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<InvoiceLineItem> }) => {
      const { error } = await supabase
        .from('gl_invoice_lines')
        .update({
          rowid_products: data.productId,
          renamed_product_name: data.description,
          qty_sold: data.quantity,
          selling_price: data.unitPrice,
          line_total: (data.quantity || 0) * (data.unitPrice || 0),
          product_sale_note: data.notes
        })
        .eq('id', id);
        
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Line Item Updated',
        description: 'Line item has been updated successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update line item',
        variant: 'destructive'
      });
    }
  });

  // Delete line item
  const deleteLineItem = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from('gl_invoice_lines')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Line Item Deleted',
        description: 'Line item has been deleted successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete line item',
        variant: 'destructive'
      });
    }
  });

  return {
    fetchInvoices,
    getInvoice,
    deleteInvoice,
    addPayment,
    updatePayment,
    deletePayment,
    addLineItem,
    updateLineItem,
    deleteLineItem,
    isLoading,
    error
  };
}
