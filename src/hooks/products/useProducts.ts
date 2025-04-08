import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductFilters } from '@/types/products';
import { Account } from '@/types/accounts';

/**
 * Hook for fetching products with optional filtering
 * @param filters - Optional filters to apply to the query
 * @returns Query result containing products data
 */
export const useProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      // Step 1: Fetch products data
      let query = supabase
        .from('gl_products')
        .select('*');

      // Apply filters if provided
      if (filters) {
        if (filters.category) {
          query = query.eq('category', filters.category);
        }
        
        if (filters.vendorId) {
          query = query.eq('rowid_accounts', filters.vendorId);
        }
        
        if (filters.purchaseOrderId) {
          query = query.eq('rowid_purchase_orders', filters.purchaseOrderId);
        }
        
        if (filters.searchTerm) {
          query = query.or(
            `vendor_product_name.ilike.%${filters.searchTerm}%,new_product_name.ilike.%${filters.searchTerm}%`
          );
        }
      }

      const { data: products, error } = await query;

      if (error) {
        throw new Error(`Error fetching products: ${error.message}`);
      }

      // Get unique account IDs from products
      const accountIds = products
        .map(product => product.rowid_accounts)
        .filter((id): id is string => id !== null && id !== undefined);
      
      if (accountIds.length === 0) {
        return products as Product[];
      }

      // Step 2: Fetch related accounts data
      const { data: accounts, error: accountsError } = await supabase
        .from('gl_accounts')
        .select('*')
        .in('glide_row_id', accountIds);

      if (accountsError) {
        throw new Error(`Error fetching accounts: ${accountsError.message}`);
      }

      // Step 3: Create a lookup map for accounts
      const accountMap = new Map<string, Account>();
      accounts.forEach(account => {
        accountMap.set(account.glide_row_id, account);
      });

      // Step 4: Manually join products with accounts
      const productsWithAccounts = products.map(product => {
        const result = { ...product } as Product;
        
        if (product.rowid_accounts) {
          const account = accountMap.get(product.rowid_accounts);
          if (account) {
            result.account = account;
          }
        }
        
        return result;
      });

      return productsWithAccounts;
    },
  });
};

export default useProducts;
