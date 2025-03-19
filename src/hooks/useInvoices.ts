import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Invoice, GlInvoice, GlInvoiceLine, GlCustomerPayment, GlAccount, ProductDetails } from '@/types';
import { mapGlInvoiceToInvoice } from '@/utils/mapping-utils';

// Fetch product details for an invoice line
async function fetchProductDetails(productGlideId: string | null | undefined): Promise<ProductDetails | null> {
  if (!productGlideId) return null;
  
  try {
    const { data, error } = await supabase
      .from('gl_products')
      .select('*')
      .eq('glide_row_id', productGlideId)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching product details:', error);
      return null;
    }
    
    if (!data) return null;
    
    return {
      id: data.id,
      glide_row_id: data.glide_row_id,
      name: data.display_name || data.new_product_name || data.vendor_product_name || 'Unnamed Product',
      display_name: data.display_name,
      vendor_product_name: data.vendor_product_name,
      new_product_name: data.new_product_name,
      cost: data.cost,
      total_qty_purchased: data.total_qty_purchased,
      category: data.category,
      product_image1: data.product_image1,
      purchase_notes: data.purchase_notes,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (err) {
    console.error('Error fetching product details:', err);
    return null;
  }
}

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
        setIsLoading(false);
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
      
      // Enhance line items with product details
      const enhancedLineItems = await Promise.all(
        (lineItemsData || []).map(async (line) => {
          if (line.rowid_products) {
            const productDetails = await fetchProductDetails(line.rowid_products);
            return {
              ...line,
              productDetails: productDetails || undefined
            };
          }
          return line;
        })
      );
      
      // Group line items and payments by invoice ID
      const lineItemsByInvoice = enhancedLineItems.reduce((acc, item) => {
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
        
        // Pre-process the invoice data for mapping
        const enrichedInvoice = {
          ...invoice,
          accountName,
          lineItems,
          payments
        };
        
        return mapGlInvoiceToInvoice(enrichedInvoice);
      });
      
      setInvoices(mappedInvoices);
      setIsLoading(false);
      return mappedInvoices;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoices';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
      });
      setIsLoading(false);
      return [];
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
      
      // Enhance line items with product details
      const enhancedLineItems = await Promise.all(
        (lineItems || []).map(async (line) => {
          if (line.rowid_products) {
            const productDetails = await fetchProductDetails(line.rowid_products);
            return {
              ...line,
              productDetails: productDetails || undefined
            };
          }
          return line;
        })
      );
      
      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_customer_payments')
        .select('*')
        .eq('rowid_invoices', invoice.glide_row_id);
      
      if (paymentsError) throw paymentsError;
      
      // Pre-process the invoice data for mapping
      const enrichedInvoice = {
        ...invoice,
        accountName: account?.account_name || 'Unknown Account',
        lineItems: enhancedLineItems as GlInvoiceLine[] || [],
        payments: payments as GlCustomerPayment[] || []
      };
      
      return mapGlInvoiceToInvoice(enrichedInvoice);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoice';
      toast({
        title: 'Error',
        description: errorMessage,
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
        
        // Pre-process the invoice data for mapping
        const enrichedInvoice = {
          ...invoice,
          accountName: account.account_name,
          lineItems,
          payments
        };
        
        return mapGlInvoiceToInvoice(enrichedInvoice);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoices for account';
      toast({
        title: 'Error',
        description: errorMessage,
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
