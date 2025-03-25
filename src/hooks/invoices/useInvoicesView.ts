import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useInvoiceDetail } from './useInvoiceDetail';
import { useInvoiceLineItems } from './useInvoiceLineItems';
import { useInvoicePayments } from './useInvoicePayments';
import { Invoice, InvoiceFilters, InvoiceWithDetails } from '@/types/invoice';
import { InvoiceListItem } from '@/types/invoiceView';
import { hasProperty } from '@/types/supabase';

export function useInvoicesView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { getInvoice } = useInvoiceDetail();
  const { deleteLineItem, addLineItem, updateLineItem } = useInvoiceLineItems();
  const { deletePayment, addPayment, updatePayment } = useInvoicePayments();
  
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
      
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          query = query.eq('payment_status', filters.status);
        }
        
        if (filters.customerId) {
          query = query.eq('rowid_accounts', filters.customerId);
        }
        
        if (filters.dateFrom) {
          const fromDate = filters.dateFrom instanceof Date 
            ? filters.dateFrom.toISOString()
            : new Date(filters.dateFrom).toISOString();
          query = query.gte('invoice_order_date', fromDate);
        }
        
        if (filters.dateTo) {
          const toDate = filters.dateTo instanceof Date 
            ? filters.dateTo.toISOString()
            : new Date(filters.dateTo).toISOString();
          query = query.lte('invoice_order_date', toDate);
        }
        
        if (filters.search) {
          query = query.or(`glide_row_id.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
        }
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      if (!data) return [];
      
      return data.map(invoice => {
        let customerName = 'Unknown Customer';
        
        if (invoice.customer && 
            typeof invoice.customer === 'object' && 
            invoice.customer !== null) {
          if (hasProperty(invoice.customer, 'account_name')) {
            customerName = invoice.customer.account_name || 'Unknown Customer';
          }
        }
        
        const invoiceDate = invoice.invoice_order_date ? new Date(invoice.invoice_order_date) : new Date(invoice.created_at);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30);
        
        return {
          id: invoice.id,
          invoiceNumber: invoice.glide_row_id || invoice.id.substring(0, 8),
          glideRowId: invoice.glide_row_id,
          customerId: invoice.rowid_accounts || '',
          customerName: customerName,
          date: invoice.invoice_order_date ? new Date(invoice.invoice_order_date) : new Date(invoice.created_at),
          dueDate: dueDate,
          total: Number(invoice.total_amount || 0),
          balance: Number(invoice.balance || 0),
          status: invoice.payment_status || 'draft',
          lineItemsCount: 0,
          notes: invoice.notes || '',
          amountPaid: Number(invoice.total_paid || 0)
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
  
  return {
    fetchInvoices,
    getInvoice,
    deleteLineItem,
    addLineItem,
    updateLineItem,
    deletePayment,
    addPayment,
    updatePayment,
    isLoading,
    error
  };
}
