import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/products';

export interface ProductStockItem {
  productId: string;
  initialStock: number;
  invoicedQuantity: number;
  sampledQuantity: number;
  currentStock: number;
  invoiceLines: Array<{
    id: string;
    invoiceId: string;
    invoiceUid?: string;
    quantity: number;
    date: string;
    customerName?: string;
  }>;
  sampleEstimateLines: Array<{
    id: string;
    estimateId: string;
    estimateUid?: string;
    quantity: number;
    date: string;
    customerName?: string;
  }>;
}

/**
 * Hook to calculate current stock level for a specific product
 * 
 * Stock calculation logic:
 * - Initial stock is total_qty_purchased from the product
 * - Invoiced quantity is the sum of quantities from all invoice lines for this product
 * - Sampled quantity is the sum of quantities from estimate lines where the estimate has sample=true
 * - Current stock = Initial stock - Invoiced quantity - Sampled quantity
 * 
 * @param productId - The glide_row_id of the product to calculate stock for
 * @returns Query result containing stock information and related line items
 */
export const useProductStock = (productId: string | undefined) => {
  return useQuery({
    queryKey: ['product-stock', productId],
    queryFn: async (): Promise<ProductStockItem> => {
      if (!productId) {
        throw new Error('Product ID is required');
      }

      // Fetch product to get initial stock (total_qty_purchased)
      const { data: product, error: productError } = await supabase
        .from('gl_products')
        .select('glide_row_id, total_qty_purchased')
        .eq('glide_row_id', productId)
        .single();

      if (productError) {
        throw new Error(`Error fetching product: ${productError.message}`);
      }

      if (!product) {
        throw new Error('Product not found');
      }

      const initialStock = product.total_qty_purchased || 0;

      // Fetch invoice lines for this product
      const { data: invoiceLines, error: invoiceLinesError } = await supabase
        .from('gl_invoice_lines')
        .select(`
          id, 
          glide_row_id, 
          rowid_invoices, 
          rowid_products, 
          quantity,
          gl_invoices(
            glide_row_id,
            invoice_uid,
            invoice_date,
            rowid_accounts,
            gl_accounts(
              account_name
            )
          )
        `)
        .eq('rowid_products', productId);

      if (invoiceLinesError) {
        throw new Error(`Error fetching invoice lines: ${invoiceLinesError.message}`);
      }

      // Fetch estimate lines for this product, but only from samples (estimates with is_a_sample = true)
      const { data: estimateLines, error: estimateLinesError } = await supabase
        .from('gl_estimate_lines')
        .select(`
          id, 
          glide_row_id, 
          rowid_estimates, 
          rowid_products, 
          quantity,
          gl_estimates(
            glide_row_id,
            estimate_uid,
            estimate_date,
            is_a_sample,
            rowid_accounts,
            gl_accounts(
              account_name
            )
          )
        `)
        .eq('rowid_products', productId);

      if (estimateLinesError) {
        throw new Error(`Error fetching estimate lines: ${estimateLinesError.message}`);
      }

      // Process invoice lines
      const processedInvoiceLines = invoiceLines.map((line) => ({
        id: line.glide_row_id,
        invoiceId: line.rowid_invoices,
        invoiceUid: line.gl_invoices?.invoice_uid,
        quantity: line.quantity || 0,
        date: line.gl_invoices?.invoice_date || '',
        customerName: line.gl_invoices?.gl_accounts?.account_name
      }));

      const invoicedQuantity = processedInvoiceLines.reduce(
        (total, line) => total + line.quantity, 
        0
      );

      // Process sample estimate lines (only from estimates with is_a_sample = true)
      const processedSampleEstimateLines = estimateLines
        .filter((line) => line.gl_estimates?.is_a_sample)
        .map((line) => ({
          id: line.glide_row_id,
          estimateId: line.rowid_estimates,
          estimateUid: line.gl_estimates?.estimate_uid,
          quantity: line.quantity || 0,
          date: line.gl_estimates?.estimate_date || '',
          customerName: line.gl_estimates?.gl_accounts?.account_name
        }));

      const sampledQuantity = processedSampleEstimateLines.reduce(
        (total, line) => total + line.quantity, 
        0
      );

      // Calculate current stock
      const currentStock = initialStock - invoicedQuantity - sampledQuantity;

      return {
        productId,
        initialStock,
        invoicedQuantity,
        sampledQuantity,
        currentStock,
        invoiceLines: processedInvoiceLines,
        sampleEstimateLines: processedSampleEstimateLines
      };
    },
    enabled: !!productId
  });
};

export default useProductStock;
