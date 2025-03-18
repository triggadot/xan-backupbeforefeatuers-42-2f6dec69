
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Invoice, GlInvoice, GlInvoiceLine, GlCustomerPayment, GlAccount } from '@/types';
import { mapGlInvoiceToInvoice } from '@/utils/mapping-utils';

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('gl_invoices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (invoicesError) throw invoicesError;
      
      // Early return if no invoices
      if (!invoicesData || invoicesData.length === 0) {
        setInvoices([]);
        return [];
      }
      
      // Get all account IDs to fetch account names
      const accountIds = [...new Set(invoicesData.map(inv => inv.rowid_accounts))];
      
      // Fetch accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('gl_accounts')
        .select('*')
        .in('glide_row_id', accountIds);
      
      if (accountsError) throw accountsError;
      
      // Create a map of account ID to name
      const accountMap = (accountsData || []).reduce((acc, account) => {
        acc[account.glide_row_id] = account.account_name;
        return acc;
      }, {} as Record<string, string>);
      
      // Fetch all line items for these invoices
      const invoiceIds = invoicesData.map(inv => inv.glide_row_id);
      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from('gl_invoice_lines')
        .select('*')
        .in('rowid_invoices', invoiceIds);
      
      if (lineItemsError) throw lineItemsError;
      
      // Fetch all payments for these invoices
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('gl_customer_payments')
        .select('*')
        .in('rowid_invoices', invoiceIds);
        
      if (paymentsError) throw paymentsError;
      
      // Group line items and payments by invoice ID
      const lineItemsByInvoice = (lineItemsData || []).reduce((acc, item) => {
        if (!acc[item.rowid_invoices]) {
          acc[item.rowid_invoices] = [];
        }
        acc[item.rowid_invoices].push(item);
        return acc;
      }, {} as Record<string, GlInvoiceLine[]>);
      
      const paymentsByInvoice = (paymentsData || []).reduce((acc, payment) => {
        if (!acc[payment.rowid_invoices]) {
          acc[payment.rowid_invoices] = [];
        }
        acc[payment.rowid_invoices].push(payment);
        return acc;
      }, {} as Record<string, GlCustomerPayment[]>);
      
      // Map database objects to domain objects
      const mappedInvoices = invoicesData.map((invoice: GlInvoice) => {
        const accountName = accountMap[invoice.rowid_accounts] || 'Unknown Account';
        const lineItems = lineItemsByInvoice[invoice.glide_row_id] || [];
        const payments = paymentsByInvoice[invoice.glide_row_id] || [];
        
        return mapGlInvoiceToInvoice(invoice, accountName, lineItems, payments);
      });
      
      setInvoices(mappedInvoices);
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
    try {
      // Fetch the invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('gl_invoices')
        .select('*')
        .eq('id', id)
        .single();
      
      if (invoiceError) throw invoiceError;
      if (!invoice) throw new Error('Invoice not found');
      
      // Fetch the account
      const { data: account, error: accountError } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('glide_row_id', invoice.rowid_accounts)
        .single();
      
      if (accountError) throw accountError;
      
      // Fetch line items
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('gl_invoice_lines')
        .select('*')
        .eq('rowid_invoices', invoice.glide_row_id);
      
      if (lineItemsError) throw lineItemsError;
      
      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_customer_payments')
        .select('*')
        .eq('rowid_invoices', invoice.glide_row_id);
      
      if (paymentsError) throw paymentsError;
      
      // Map to domain object
      return mapGlInvoiceToInvoice(
        invoice as GlInvoice, 
        account?.account_name || 'Unknown Account', 
        lineItems as GlInvoiceLine[] || [], 
        payments as GlCustomerPayment[] || []
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoice';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Fetch invoices for a specific account
  const getInvoicesForAccount = useCallback(async (accountId: string) => {
    try {
      // Get the account's glide_row_id
      const { data: account, error: accountError } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('id', accountId)
        .single();
      
      if (accountError) throw accountError;
      if (!account) throw new Error('Account not found');
      
      // Fetch invoices for this account
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('gl_invoices')
        .select('*')
        .eq('rowid_accounts', account.glide_row_id)
        .order('created_at', { ascending: false });
      
      if (invoicesError) throw invoicesError;
      
      // Early return if no invoices
      if (!invoicesData || invoicesData.length === 0) {
        return [];
      }
      
      // Get all invoice IDs to fetch line items and payments
      const invoiceIds = invoicesData.map(inv => inv.glide_row_id);
      
      // Fetch all line items for these invoices
      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from('gl_invoice_lines')
        .select('*')
        .in('rowid_invoices', invoiceIds);
      
      if (lineItemsError) throw lineItemsError;
      
      // Fetch all payments for these invoices
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('gl_customer_payments')
        .select('*')
        .in('rowid_invoices', invoiceIds);
        
      if (paymentsError) throw paymentsError;
      
      // Group line items and payments by invoice ID
      const lineItemsByInvoice = (lineItemsData || []).reduce((acc, item) => {
        if (!acc[item.rowid_invoices]) {
          acc[item.rowid_invoices] = [];
        }
        acc[item.rowid_invoices].push(item);
        return acc;
      }, {} as Record<string, GlInvoiceLine[]>);
      
      const paymentsByInvoice = (paymentsData || []).reduce((acc, payment) => {
        if (!acc[payment.rowid_invoices]) {
          acc[payment.rowid_invoices] = [];
        }
        acc[payment.rowid_invoices].push(payment);
        return acc;
      }, {} as Record<string, GlCustomerPayment[]>);
      
      // Map database objects to domain objects
      return invoicesData.map((invoice: GlInvoice) => {
        const lineItems = lineItemsByInvoice[invoice.glide_row_id] || [];
        const payments = paymentsByInvoice[invoice.glide_row_id] || [];
        
        return mapGlInvoiceToInvoice(invoice, account.account_name, lineItems, payments);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoices for account';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  // Fetch invoices on component mount
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    isLoading,
    error,
    fetchInvoices,
    getInvoice,
    getInvoicesForAccount
  };
}
