
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceFilters, InvoiceWithCustomer } from '@/types/invoice';
import { hasProperty } from '@/types/supabase';
import { useInvoiceLineItems } from './useInvoiceLineItems';
import { useInvoicePayments } from './useInvoicePayments';
import { useInvoiceDetail } from './useInvoiceDetail';
import { useInvoiceDeletion } from './useInvoiceDeletion';
import { useToast } from '@/hooks/use-toast';

export function useInvoicesView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Import functionality from smaller hooks
  const lineItemHooks = useInvoiceLineItems();
  const paymentHooks = useInvoicePayments();
  const detailHook = useInvoiceDetail();
  const deletionHook = useInvoiceDeletion();
  
  const fetchInvoices = useCallback(async (filters?: InvoiceFilters): Promise<InvoiceWithCustomer[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('gl_invoices')
        .select(`
          *,
          customer:rowid_accounts(*)
        `);
      
      // Apply filters if provided
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          query = query.eq('payment_status', filters.status);
        }
        
        if (filters.customerId) {
          query = query.eq('rowid_accounts', filters.customerId);
        }
        
        if (filters.fromDate) {
          const fromDate = filters.fromDate instanceof Date 
            ? filters.fromDate.toISOString()
            : new Date(filters.fromDate).toISOString();
          query = query.gte('invoice_order_date', fromDate);
        }
        
        if (filters.toDate) {
          const toDate = filters.toDate instanceof Date 
            ? filters.toDate.toISOString()
            : new Date(filters.toDate).toISOString();
          query = query.lte('invoice_order_date', toDate);
        }
        
        if (filters.search) {
          query = query.or(`invoice_number.ilike.%${filters.search}%,customer.account_name.ilike.%${filters.search}%`);
        }
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      if (!data) return [];
      
      return data.map(invoice => {
        // Safely get customer name with null checks
        let customerName = 'Unknown Customer';
        
        if (invoice.customer && 
            typeof invoice.customer === 'object' && 
            invoice.customer !== null) {
          if (hasProperty(invoice.customer, 'account_name')) {
            customerName = invoice.customer.account_name || 'Unknown Customer';
          }
        }
        
        // Use invoice_order_date to calculate due date since due_date doesn't exist
        const invoiceDate = invoice.invoice_order_date 
          ? new Date(invoice.invoice_order_date) 
          : new Date(invoice.created_at);
        
        // Add 30 days to invoice date as default due date
        const dueDate = new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        return {
          id: invoice.glide_row_id,
          invoiceNumber: invoice.glide_row_id,
          customerName: customerName,
          invoiceDate: invoiceDate,
          dueDate: dueDate, // Using calculated due date
          status: invoice.payment_status || 'draft',
          amount: Number(invoice.total_amount || 0),
          amountPaid: Number(invoice.total_paid || 0),
          balance: Number(invoice.balance || 0),
          createdAt: new Date(invoice.created_at),
          updatedAt: invoice.updated_at ? new Date(invoice.updated_at) : undefined,
          customer: invoice.customer
        };
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching invoices';
      setError(errorMessage);
      console.error('Error fetching invoices:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Combine all the hooks' methods
  return {
    fetchInvoices,
    getInvoice: detailHook.getInvoice,
    addLineItem: lineItemHooks.addLineItem,
    updateLineItem: lineItemHooks.updateLineItem,
    deleteLineItem: lineItemHooks.deleteLineItem,
    addPayment: paymentHooks.addPayment,
    updatePayment: paymentHooks.updatePayment,
    deletePayment: paymentHooks.deletePayment,
    deleteInvoice: deletionHook?.deleteInvoice || (async () => Promise.resolve(false)),
    isLoading: isLoading || lineItemHooks.isLoading || paymentHooks.isLoading || detailHook.isLoading,
    error: error || lineItemHooks.error || paymentHooks.error || detailHook.error
  };
}
