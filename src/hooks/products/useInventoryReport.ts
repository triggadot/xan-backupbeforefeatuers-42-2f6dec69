import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProductInventoryItem {
  id: string;
  glide_row_id: string;
  display_name: string;
  category?: string;
  cost: number;
  total_qty_purchased: number;
  initialStock: number;
  invoicedQuantity: number;
  sampledQuantity: number;
  currentStock: number;
  stockValue: number;
  vendor_name?: string;
  product_image1?: string;
  product_purchase_date?: string;
}

/**
 * Hook for generating an inventory report with current stock levels
 * Stock calculation logic:
 * - Initial stock is total_qty_purchased from the product
 * - Invoiced quantity is the sum of quantities from all invoice lines for this product
 * - Sampled quantity is the sum of quantities from estimate lines where the estimate has sample=true
 * - Current stock = Initial stock - Invoiced quantity - Sampled quantity
 * 
 * @returns Query result containing inventory report data
 */
export const useInventoryReport = () => {
  return useQuery({
    queryKey: ['inventory-report'],
    queryFn: async (): Promise<ProductInventoryItem[]> => {
      // Fetch all products
      const { data: products, error: productsError } = await supabase
        .from('gl_products')
        .select(`
          id,
          glide_row_id,
          display_name,
          vendor_product_name,
          new_product_name,
          category,
          cost,
          total_qty_purchased,
          product_purchase_date,
          product_image1,
          rowid_accounts,
          gl_accounts(account_name)
        `);

      if (productsError) {
        throw new Error(`Error fetching products: ${productsError.message}`);
      }

      // Fetch all invoice lines to calculate invoiced quantities
      const { data: allInvoiceLines, error: invoiceLinesError } = await supabase
        .from('gl_invoice_lines')
        .select(`
          rowid_products,
          quantity
        `);

      if (invoiceLinesError) {
        throw new Error(`Error fetching invoice lines: ${invoiceLinesError.message}`);
      }

      // Fetch all estimate lines from sample estimates to calculate sample quantities
      const { data: allEstimateLines, error: estimateLinesError } = await supabase
        .from('gl_estimate_lines')
        .select(`
          rowid_products,
          quantity,
          gl_estimates(is_a_sample)
        `)
        .not('gl_estimates', 'is', null);

      if (estimateLinesError) {
        throw new Error(`Error fetching estimate lines: ${estimateLinesError.message}`);
      }

      // Calculate stock levels for each product
      const inventoryItems: ProductInventoryItem[] = products.map(product => {
        // Get invoice lines for this product
        const productInvoiceLines = allInvoiceLines.filter(
          line => line.rowid_products === product.glide_row_id
        );
        
        // Calculate invoiced quantity
        const invoicedQuantity = productInvoiceLines.reduce(
          (sum, line) => sum + (line.quantity || 0),
          0
        );
        
        // Get sample estimate lines for this product
        const productSampleEstimateLines = allEstimateLines.filter(
          line => line.rowid_products === product.glide_row_id && line.gl_estimates?.is_a_sample === true
        );
        
        // Calculate sampled quantity
        const sampledQuantity = productSampleEstimateLines.reduce(
          (sum, line) => sum + (line.quantity || 0),
          0
        );
        
        // Calculate current stock
        const initialStock = product.total_qty_purchased || 0;
        const currentStock = initialStock - invoicedQuantity - sampledQuantity;
        const stockValue = currentStock * (product.cost || 0);
        
        return {
          id: product.id,
          glide_row_id: product.glide_row_id,
          display_name: product.display_name || product.new_product_name || product.vendor_product_name || 'Unnamed Product',
          category: product.category,
          cost: product.cost || 0,
          total_qty_purchased: product.total_qty_purchased || 0,
          initialStock,
          invoicedQuantity,
          sampledQuantity,
          currentStock,
          stockValue,
          vendor_name: product.gl_accounts?.account_name,
          product_image1: product.product_image1,
          product_purchase_date: product.product_purchase_date
        };
      });
      
      return inventoryItems;
    }
  });
};

export default useInventoryReport;
