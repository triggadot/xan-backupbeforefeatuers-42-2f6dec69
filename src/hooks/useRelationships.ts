import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import type { Tables } from '../integrations/supabase/types';
import { 
  createGlideRowIdMap, 
  fetchRelatedRecordsByGlideIds,
  joinRelatedRecords
} from '../lib/relation-helpers';

/**
 * Hook to fetch an account by its glide_row_id
 */
export function useAccount(accountGlideId: string | null | undefined) {
  return useQuery({
    queryKey: ['account', accountGlideId],
    queryFn: async () => {
      if (!accountGlideId) return null;
      
      const { data, error } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('glide_row_id', accountGlideId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!accountGlideId
  });
}

/**
 * Hook to fetch invoice lines with product details
 */
export function useInvoiceLines(invoiceGlideId: string | null | undefined) {
  return useQuery({
    queryKey: ['invoice-lines', invoiceGlideId],
    queryFn: async () => {
      if (!invoiceGlideId) return [];
      
      // Fetch invoice lines
      const { data: lines, error } = await supabase
        .from('gl_invoice_lines')
        .select('*')
        .eq('rowid_invoices', invoiceGlideId);
        
      if (error) throw error;
      if (!lines || lines.length === 0) return [];
      
      // Get product IDs
      const productIds = lines
        .map(line => line.rowid_products)
        .filter(Boolean) as string[];
        
      if (productIds.length === 0) {
        return lines.map(line => ({ ...line, product: null }));
      }
      
      // Fetch products
      const products = await fetchRelatedRecordsByGlideIds<Tables['gl_products']>(
        'gl_products', 
        productIds
      );
      
      // Create product map
      const productMap = createGlideRowIdMap(products);
      
      // Join products to lines
      return joinRelatedRecords(
        lines, 
        productMap, 
        'rowid_products', 
        'product'
      );
    },
    enabled: !!invoiceGlideId
  });
}

/**
 * Hook to fetch estimate lines with product details
 */
export function useEstimateLines(estimateGlideId: string | null | undefined) {
  return useQuery({
    queryKey: ['estimate-lines', estimateGlideId],
    queryFn: async () => {
      if (!estimateGlideId) return [];
      
      // Fetch estimate lines
      const { data: lines, error } = await supabase
        .from('gl_estimate_lines')
        .select('*')
        .eq('rowid_estimates', estimateGlideId);
        
      if (error) throw error;
      if (!lines || lines.length === 0) return [];
      
      // Get product IDs
      const productIds = lines
        .map(line => line.rowid_products)
        .filter(Boolean) as string[];
        
      if (productIds.length === 0) {
        return lines.map(line => ({ ...line, product: null }));
      }
      
      // Fetch products
      const products = await fetchRelatedRecordsByGlideIds<Tables['gl_products']>(
        'gl_products', 
        productIds
      );
      
      // Create product map
      const productMap = createGlideRowIdMap(products);
      
      // Join products to lines
      return joinRelatedRecords(
        lines, 
        productMap, 
        'rowid_products', 
        'product'
      );
    },
    enabled: !!estimateGlideId
  });
}

/**
 * Hook to fetch purchase order products
 */
export function usePurchaseOrderProducts(purchaseOrderGlideId: string | null | undefined) {
  return useQuery({
    queryKey: ['purchase-order-products', purchaseOrderGlideId],
    queryFn: async () => {
      if (!purchaseOrderGlideId) return [];
      
      const { data, error } = await supabase
        .from('gl_products')
        .select('*')
        .eq('rowid_purchase_orders', purchaseOrderGlideId);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!purchaseOrderGlideId
  });
}

/**
 * Hook to fetch invoice payments
 */
export function useInvoicePayments(invoiceGlideId: string | null | undefined) {
  return useQuery({
    queryKey: ['invoice-payments', invoiceGlideId],
    queryFn: async () => {
      if (!invoiceGlideId) return [];
      
      const { data, error } = await supabase
        .from('gl_customer_payments')
        .select('*')
        .eq('rowid_invoices', invoiceGlideId);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!invoiceGlideId
  });
}

/**
 * Hook to fetch complete invoice data using the database function
 */
export function useCompleteInvoice(invoiceGlideId: string | null | undefined) {
  return useQuery({
    queryKey: ['complete-invoice', invoiceGlideId],
    queryFn: async () => {
      if (!invoiceGlideId) return null;
      
      try {
        // Try to use the database function
        const { data, error } = await supabase.rpc(
          'get_complete_invoice',
          { invoice_glide_id: invoiceGlideId }
        );
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error using RPC, falling back to manual fetching:', error);
        
        // Fallback to manual fetching
        const { data: invoice, error: invoiceError } = await supabase
          .from('gl_invoices')
          .select('*')
          .eq('glide_row_id', invoiceGlideId)
          .single();
          
        if (invoiceError) throw invoiceError;
        if (!invoice) return null;
        
        // Get account
        let account = null;
        if (invoice.rowid_accounts) {
          const { data: accountData } = await supabase
            .from('gl_accounts')
            .select('*')
            .eq('glide_row_id', invoice.rowid_accounts)
            .single();
            
          account = accountData;
        }
        
        // Get lines with products
        const linesQuery = useInvoiceLines(invoiceGlideId);
        const lines = linesQuery.data || [];
        
        // Get payments
        const paymentsQuery = useInvoicePayments(invoiceGlideId);
        const payments = paymentsQuery.data || [];
        
        return {
          invoice,
          account,
          lines,
          payments
        };
      }
    },
    enabled: !!invoiceGlideId
  });
}

/**
 * Hook to fetch complete estimate data
 */
export function useCompleteEstimate(estimateGlideId: string | null | undefined) {
  return useQuery({
    queryKey: ['complete-estimate', estimateGlideId],
    queryFn: async () => {
      if (!estimateGlideId) return null;
      
      try {
        // Try to use the database function
        const { data, error } = await supabase.rpc(
          'get_complete_estimate',
          { estimate_glide_id: estimateGlideId }
        );
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error using RPC, falling back to manual fetching:', error);
        
        // Fallback to manual fetching
        const { data: estimate, error: estimateError } = await supabase
          .from('gl_estimates')
          .select('*')
          .eq('glide_row_id', estimateGlideId)
          .single();
          
        if (estimateError) throw estimateError;
        if (!estimate) return null;
        
        // Get account
        let account = null;
        if (estimate.rowid_accounts) {
          const { data: accountData } = await supabase
            .from('gl_accounts')
            .select('*')
            .eq('glide_row_id', estimate.rowid_accounts)
            .single();
            
          account = accountData;
        }
        
        // Get lines with products
        const linesQuery = useEstimateLines(estimateGlideId);
        const lines = linesQuery.data || [];
        
        // Get credits
        const { data: credits } = await supabase
          .from('gl_customer_credits')
          .select('*')
          .eq('rowid_estimates', estimateGlideId);
        
        return {
          estimate,
          account,
          lines,
          credits: credits || []
        };
      }
    },
    enabled: !!estimateGlideId
  });
}
