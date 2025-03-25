
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceListItem, InvoiceWithDetails, InvoiceLineItem, InvoicePayment } from '@/types/invoice';
import { InvoiceFilters } from '@/types/invoice';
import { ProductDetails } from '@/types/invoiceView';

export function useInvoicesView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = async (filters?: InvoiceFilters): Promise<InvoiceListItem[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('gl_invoices')
        .select(`
          id,
          glide_row_id,
          invoice_order_date,
          created_at,
          updated_at,
          payment_status,
          total_amount,
          total_paid,
          balance,
          notes,
          rowid_accounts,
          customer:rowid_accounts(account_name, id, glide_row_id)
        `);
        
      // Apply filters if provided
      if (filters) {
        if (filters.status) {
          query = query.eq('payment_status', filters.status);
        }
        
        if (filters.customerId) {
          query = query.eq('rowid_accounts', filters.customerId);
        }
        
        if (filters.dateFrom) {
          const date = new Date(filters.dateFrom);
          query = query.gte('invoice_order_date', date.toISOString());
        }
        
        if (filters.dateTo) {
          const date = new Date(filters.dateTo);
          query = query.lte('invoice_order_date', date.toISOString());
        }
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      if (!data) return [];
      
      // Get line items count for each invoice
      const invoiceIds = data.map(invoice => invoice.glide_row_id);
      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from('gl_invoice_lines')
        .select('rowid_invoices, id')
        .in('rowid_invoices', invoiceIds);
        
      if (lineItemsError) throw lineItemsError;
      
      // Count line items per invoice
      const lineItemCounts: Record<string, number> = {};
      if (lineItemsData) {
        lineItemsData.forEach(item => {
          if (item.rowid_invoices) {
            lineItemCounts[item.rowid_invoices] = (lineItemCounts[item.rowid_invoices] || 0) + 1;
          }
        });
      }
      
      return data.map(invoice => {
        let customerName = 'Unknown Customer';
        if (invoice.customer && typeof invoice.customer === 'object') {
          customerName = invoice.customer.account_name || 'Unknown Customer';
        }
        
        return {
          id: invoice.id,
          invoiceNumber: invoice.glide_row_id || invoice.id.substring(0, 8),
          glideRowId: invoice.glide_row_id,
          customerId: invoice.rowid_accounts,
          customerName: customerName,
          date: invoice.invoice_order_date ? new Date(invoice.invoice_order_date) : new Date(invoice.created_at),
          dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
          total: Number(invoice.total_amount || 0),
          balance: Number(invoice.balance || 0),
          status: invoice.payment_status || 'draft',
          lineItemsCount: lineItemCounts[invoice.glide_row_id] || 0,
          notes: invoice.notes || '',
          amountPaid: Number(invoice.total_paid || 0)
        };
      });
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
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
      
      // Safely get customer name with null checks
      let customerName = 'Unknown Customer';
      let accountData = undefined;
      
      if (invoice.customer && 
          typeof invoice.customer === 'object' && 
          invoice.customer !== null) {
        accountData = invoice.customer;
        
        if (accountData && typeof accountData === 'object' && 'account_name' in accountData) {
          customerName = accountData.account_name || 'Unknown Customer';
        }
      }
      
      // Convert from DB format to InvoiceWithDetails format
      const formattedLineItems: InvoiceLineItem[] = lineItems.map(item => ({
        id: item.id,
        invoiceId: invoice.glide_row_id || '',
        productId: item.rowid_products || '',
        description: item.renamed_product_name || '',
        productName: item.renamed_product_name || '',
        quantity: Number(item.qty_sold || 0),
        unitPrice: Number(item.selling_price || 0),
        total: Number(item.line_total || 0),
        notes: item.product_sale_note || '',
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        productDetails: item.product
      }));
      
      const formattedPayments: InvoicePayment[] = payments.map(payment => ({
        id: payment.id,
        invoiceId: invoice.glide_row_id || '',
        accountId: payment.rowid_accounts || '',
        date: payment.date_of_payment ? new Date(payment.date_of_payment) : new Date(payment.created_at),
        amount: Number(payment.payment_amount || 0),
        paymentMethod: payment.type_of_payment || 'Payment',
        notes: payment.payment_note || '',
        paymentDate: payment.date_of_payment ? new Date(payment.date_of_payment) : new Date(payment.created_at),
        createdAt: new Date(payment.created_at),
        updatedAt: new Date(payment.updated_at)
      }));
      
      // Calculate the total amount paid
      const totalPaid = formattedPayments.reduce((sum, payment) => sum + payment.amount, 0);
      
      return {
        id: invoice.id,
        glide_row_id: invoice.glide_row_id || '',
        invoiceNumber: invoice.glide_row_id || invoice.id.substring(0, 8),
        customerId: invoice.rowid_accounts || '',
        customerName: customerName,
        invoiceDate: invoice.invoice_order_date ? new Date(invoice.invoice_order_date) : new Date(invoice.created_at),
        status: (invoice.payment_status || 'draft') as 'draft' | 'sent' | 'paid' | 'partial' | 'overdue',
        total_amount: Number(invoice.total_amount || 0),
        total_paid: Number(invoice.total_paid || 0),
        balance: Number(invoice.balance || 0),
        notes: invoice.notes || '',
        lineItems: formattedLineItems,
        payments: formattedPayments,
        account: accountData,
        amountPaid: totalPaid,
        subtotal: Number(invoice.total_amount || 0),
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
        createdAt: new Date(invoice.created_at),
        updatedAt: invoice.updated_at ? new Date(invoice.updated_at) : undefined
      };
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError(err instanceof Error ? err.message : 'Unknown error fetching invoice');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const addLineItem = useMutation({
    mutationFn: async ({ invoiceGlideId, data }: { invoiceGlideId: string, data: Partial<InvoiceLineItem> }) => {
      const { data: result, error } = await supabase
        .from('gl_invoice_lines')
        .insert({
          rowid_invoices: invoiceGlideId,
          rowid_products: data.productId,
          renamed_product_name: data.description,
          qty_sold: data.quantity,
          selling_price: data.unitPrice,
          line_total: (Number(data.quantity) * Number(data.unitPrice)),
          product_sale_note: data.notes,
          glide_row_id: crypto.randomUUID()
        })
        .select()
        .single();
        
      if (error) throw error;
      return result;
    }
  });

  const updateLineItem = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<InvoiceLineItem> }) => {
      const { data: result, error } = await supabase
        .from('gl_invoice_lines')
        .update({
          renamed_product_name: data.description,
          qty_sold: data.quantity,
          selling_price: data.unitPrice,
          line_total: (Number(data.quantity) * Number(data.unitPrice)),
          product_sale_note: data.notes,
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return result;
    }
  });

  const deleteLineItem = useMutation({
    mutationFn: async (lineItemId: string) => {
      const { error } = await supabase
        .from('gl_invoice_lines')
        .delete()
        .eq('id', lineItemId);
        
      if (error) throw error;
      return true;
    }
  });

  const addPayment = useMutation({
    mutationFn: async ({ invoiceGlideId, data }: { invoiceGlideId: string, data: Partial<InvoicePayment> }) => {
      const { data: result, error } = await supabase
        .from('gl_customer_payments')
        .insert({
          rowid_invoices: invoiceGlideId,
          rowid_accounts: data.accountId,
          payment_amount: data.amount,
          date_of_payment: data.paymentDate ? new Date(data.paymentDate).toISOString() : new Date().toISOString(),
          type_of_payment: data.paymentMethod,
          payment_note: data.notes,
          glide_row_id: crypto.randomUUID()
        })
        .select()
        .single();
        
      if (error) throw error;
      return result;
    }
  });

  const updatePayment = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<InvoicePayment> }) => {
      const { data: result, error } = await supabase
        .from('gl_customer_payments')
        .update({
          payment_amount: data.amount,
          date_of_payment: data.paymentDate ? new Date(data.paymentDate).toISOString() : undefined,
          type_of_payment: data.paymentMethod,
          payment_note: data.notes,
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return result;
    }
  });

  const deletePayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('gl_customer_payments')
        .delete()
        .eq('id', paymentId);
        
      if (error) throw error;
      return true;
    }
  });

  return {
    fetchInvoices,
    getInvoice,
    addLineItem,
    updateLineItem,
    deleteLineItem,
    addPayment,
    updatePayment,
    deletePayment,
    isLoading,
    error
  };
}
