import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Account } from '@/types/accounts';

/**
 * Hook for fetching vendors that provide products
 * 
 * @param options - Optional query options
 * @returns Query result containing vendors data, loading state, and error
 */
export function useProductVendors() {
  return useQuery({
    queryKey: ['product-vendors'],
    queryFn: async (): Promise<Account[]> => {
      // Get all accounts that are vendors (have products associated with them)
      const { data: vendorIds, error: vendorIdsError } = await supabase
        .from('gl_products')
        .select('rowid_accounts')
        .not('rowid_accounts', 'is', null)
        .order('rowid_accounts');

      if (vendorIdsError) {
        throw new Error(`Error fetching vendor IDs: ${vendorIdsError.message}`);
      }

      // Extract unique vendor IDs
      const uniqueVendorIds = [...new Set(vendorIds.map(item => item.rowid_accounts))].filter(Boolean);

      if (uniqueVendorIds.length === 0) {
        return [];
      }

      // Fetch vendor details
      const { data: vendors, error: vendorsError } = await supabase
        .from('gl_accounts')
        .select('*')
        .in('glide_row_id', uniqueVendorIds);

      if (vendorsError) {
        throw new Error(`Error fetching vendors: ${vendorsError.message}`);
      }

      // Get product counts for each vendor
      const { data: productCounts, error: countError } = await supabase
        .from('gl_products')
        .select('rowid_accounts, count')
        .not('rowid_accounts', 'is', null)
        .group('rowid_accounts');

      if (countError) {
        throw new Error(`Error fetching product counts: ${countError.message}`);
      }

      // Create a map of vendor ID to product count
      const countMap = new Map<string, number>();
      productCounts.forEach(item => {
        if (item.rowid_accounts) {
          countMap.set(item.rowid_accounts, parseInt(item.count));
        }
      });

      // Add product count to each vendor
      return vendors.map(vendor => ({
        ...vendor,
        product_count: countMap.get(vendor.glide_row_id) || 0
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching a specific vendor by ID with their products
 * 
 * @param vendorId - The vendor's glide_row_id
 * @returns Query result containing vendor data with products, loading state, and error
 */
export function useProductVendorDetail(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['product-vendor', vendorId],
    queryFn: async () => {
      if (!vendorId) {
        throw new Error('Vendor ID is required');
      }

      // Fetch vendor details
      const { data: vendor, error: vendorError } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('glide_row_id', vendorId)
        .single();

      if (vendorError) {
        throw new Error(`Error fetching vendor: ${vendorError.message}`);
      }

      // Fetch vendor's products
      const { data: products, error: productsError } = await supabase
        .from('gl_products')
        .select('*')
        .eq('rowid_accounts', vendorId)
        .order('created_at', { ascending: false });

      if (productsError) {
        throw new Error(`Error fetching vendor products: ${productsError.message}`);
      }

      // Calculate total value of products
      const totalValue = products.reduce((sum, product) => {
        return sum + (product.cost || 0) * (product.total_qty_purchased || 0);
      }, 0);

      // Get unique categories
      const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

      return {
        ...vendor,
        products,
        totalValue,
        categories,
        productCount: products.length
      };
    },
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export default useProductVendors;
