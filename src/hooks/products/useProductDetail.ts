import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductDetail } from '@/types/products';
import { Account } from '@/types/accounts';

/**
 * Hook for fetching detailed information about a specific product
 * @param productId - The glide_row_id of the product to fetch
 * @returns Query result containing detailed product data including relationships
 */
export const useProductDetail = (productId: string | undefined) => {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) {
        throw new Error('Product ID is required');
      }

      // Fetch the product
      const { data: product, error: productError } = await supabase
        .from('gl_products')
        .select('*')
        .eq('glide_row_id', productId)
        .single();

      if (productError) {
        throw new Error(`Error fetching product: ${productError.message}`);
      }

      if (!product) {
        throw new Error('Product not found');
      }

      // Fetch vendor account if available
      let vendor = null;
      if (product.rowid_accounts) {
        const { data: vendorData, error: vendorError } = await supabase
          .from('gl_accounts')
          .select('*')
          .eq('glide_row_id', product.rowid_accounts)
          .single();
          
        if (vendorError) {
          console.error(`Error fetching vendor: ${vendorError.message}`);
        } else if (vendorData) {
          vendor = vendorData;
        }
      }

      // Fetch related invoice lines
      const { data: invoiceLines, error: invoiceLinesError } = await supabase
        .from('gl_invoice_lines')
        .select('*')
        .eq('rowid_products', productId);

      if (invoiceLinesError) {
        throw new Error(`Error fetching invoice lines: ${invoiceLinesError.message}`);
      }

      // Fetch related invoices
      const invoiceIds = invoiceLines
        .map(line => line.rowid_invoices)
        .filter((id): id is string => id !== null && id !== undefined);
        
      let invoices = [];
      if (invoiceIds.length > 0) {
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('gl_invoices')
          .select('*')
          .in('glide_row_id', invoiceIds);
          
        if (invoicesError) {
          console.error(`Error fetching invoices: ${invoicesError.message}`);
        } else if (invoicesData) {
          invoices = invoicesData;
          
          // Create a lookup map for invoices
          const invoiceMap = new Map();
          invoices.forEach(invoice => {
            invoiceMap.set(invoice.glide_row_id, invoice);
          });
          
          // Join invoice lines with invoices
          invoiceLines.forEach(line => {
            if (line.rowid_invoices) {
              line.invoice = invoiceMap.get(line.rowid_invoices);
            }
          });
        }
      }

      // Fetch purchase order if available
      let purchaseOrder = null;
      if (product.rowid_purchase_orders) {
        const { data: po, error: poError } = await supabase
          .from('gl_purchase_orders')
          .select('*')
          .eq('glide_row_id', product.rowid_purchase_orders)
          .single();

        if (poError) {
          console.error(`Error fetching purchase order: ${poError.message}`);
        } else {
          purchaseOrder = po;
        }
      }

      // Fetch estimate lines related to this product
      const { data: estimateLines, error: estimateLinesError } = await supabase
        .from('gl_estimate_lines')
        .select('*')
        .eq('rowid_products', productId);

      if (estimateLinesError) {
        throw new Error(`Error fetching estimate lines: ${estimateLinesError.message}`);
      }

      // Fetch related estimates
      const estimateIds = estimateLines
        .map(line => line.rowid_estimates)
        .filter((id): id is string => id !== null && id !== undefined);
        
      let estimates = [];
      if (estimateIds.length > 0) {
        const { data: estimatesData, error: estimatesError } = await supabase
          .from('gl_estimates')
          .select('*')
          .in('glide_row_id', estimateIds);
          
        if (estimatesError) {
          console.error(`Error fetching estimates: ${estimatesError.message}`);
        } else if (estimatesData) {
          estimates = estimatesData;
          
          // Create a lookup map for estimates
          const estimateMap = new Map();
          estimates.forEach(estimate => {
            estimateMap.set(estimate.glide_row_id, estimate);
          });
          
          // Join estimate lines with estimates
          estimateLines.forEach(line => {
            if (line.rowid_estimates) {
              line.estimate = estimateMap.get(line.rowid_estimates);
            }
          });
        }
      }

      return {
        ...product,
        vendor,
        invoiceLines: invoiceLines || [],
        purchaseOrder,
        estimateLines: estimateLines || [],
      } as ProductDetail;
    },
    enabled: !!productId,
  });
};

export default useProductDetail;
