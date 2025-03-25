
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceFilters, InvoiceWithCustomer, InvoiceListItem } from '@/types/invoice';
import { hasProperty, isJsonRecord, InvoiceRow } from '@/types/supabase';
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
  
  const fetchInvoices = useCallback(async (filters?: InvoiceFilters): Promise<InvoiceListItem[]> => {
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
      
      // Map to InvoiceListItem directly
      return data.map((invoice: any) => {
        const invoiceRow = invoice as InvoiceRow;
        // Safely get customer name with null checks
        let customerName = 'Unknown Customer';
        
        if (invoiceRow.customer && 
            invoiceRow.customer !== null &&
            isJsonRecord(invoiceRow.customer)) {
          if (hasProperty(invoiceRow.customer, 'account_name')) {
            customerName = String(invoiceRow.customer.account_name || '') || 'Unknown Customer';
          }
        }
        
        // Use invoice_order_date to calculate due date since due_date doesn't exist
        const invoiceDate = invoiceRow.invoice_order_date 
          ? new Date(invoiceRow.invoice_order_date) 
          : new Date(invoiceRow.created_at || Date.now());
        
        // Add 30 days to invoice date as default due date
        const dueDate = new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        // Create an invoice list item with all the required properties
        return {
          id: invoiceRow.glide_row_id || '',
          invoiceNumber: invoiceRow.glide_row_id || '',
          glideRowId: invoiceRow.glide_row_id || '',
          customerId: invoiceRow.rowid_accounts || '',
          customerName: customerName,
          date: invoiceDate,
          dueDate: dueDate,
          status: invoiceRow.payment_status || 'draft',
          total: Number(invoiceRow.total_amount || 0),
          amountPaid: Number(invoiceRow.total_paid || 0),
          balance: Number(invoiceRow.balance || 0),
          lineItemsCount: 0, // This would need to be fetched separately if needed
          createdAt: new Date(invoiceRow.created_at || Date.now()),
          updatedAt: invoiceRow.updated_at ? new Date(invoiceRow.updated_at) : undefined,
          notes: invoice.notes
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
