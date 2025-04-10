import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Account } from '@/types/accounts';

interface VendorFilters {
  search?: string;
  status?: string;
}

/**
 * Fetch vendors (accounts of type 'vendor')
 */
const fetchVendors = async (filters?: VendorFilters): Promise<Account[]> => {
  let query = supabase
    .from('gl_accounts')
    .select('*')
    .eq('account_type', 'vendor');
  
  if (filters?.search) {
    query = query.ilike('account_name', `%${filters.search}%`);
  }
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Error fetching vendors: ${error.message}`);
  }
  
  return data || [];
};

/**
 * Hook to fetch vendors with optional filtering
 */
export const useVendors = (options?: { filters?: VendorFilters }) => {
  return useQuery<Account[], Error>({
    queryKey: ['vendors', options?.filters],
    queryFn: () => fetchVendors(options?.filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
