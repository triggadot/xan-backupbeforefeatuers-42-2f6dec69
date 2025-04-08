import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/utils/use-toast';
import { Account, GlAccount } from '@/types/accounts';

/**
 * Hook for fetching accounts (vendors and customers)
 * Uses the Glidebase pattern where relationships use rowid_ fields referencing glide_row_id values
 * 
 * @param filters - Optional filters to apply to the accounts query
 * @returns Object containing accounts data and query state
 * 
 * @example
 * // Fetch all vendor accounts
 * const { accounts, isLoading } = useFetchAccounts({ client_type: 'Vendor' });
 * 
 * // Search for accounts by name
 * const { accounts } = useFetchAccounts({ search: 'Acme' });
 */
export function useFetchAccounts(filters?: Record<string, any>) {
  const { toast } = useToast();
  
  // Format filters for query
  const getQueryFilters = useCallback(() => {
    if (!filters) return {};
    
    const queryFilters: Record<string, any> = {};
    
    if (filters.client_type) {
      queryFilters.client_type = filters.client_type;
    }
    
    if (filters.search) {
      // Handle search separately since it uses ilike
      return queryFilters;
    }
    
    return queryFilters;
  }, [filters]);
  
  // Get accounts query
  const accountsQuery = useQuery({
    queryKey: ['accounts', filters],
    queryFn: async () => {
      try {
        // Build query with filters
        let query = supabase
          .from('gl_accounts')
          .select('*');
        
        // Apply filters
        const queryFilters = getQueryFilters();
        Object.entries(queryFilters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
        
        // Apply search filter if provided
        if (filters?.search) {
          query = query.or(
            `account_name.ilike.%${filters.search}%,accounts_uid.ilike.%${filters.search}%`
          );
        }
        
        // Execute query
        const { data, error } = await query.order('account_name');
        
        if (error) throw error;
        
        // Map database records to Account type
        const accounts = (data || []).map((account: GlAccount): Account => ({
          id: account.id,
          glide_row_id: account.glide_row_id || '',
          accounts_uid: account.accounts_uid || '',
          name: account.account_name || '',
          type: account.client_type as 'Customer' | 'Vendor' | 'Customer & Vendor',
          is_customer: account.client_type === 'Customer' || account.client_type === 'Customer & Vendor',
          is_vendor: account.client_type === 'Vendor' || account.client_type === 'Customer & Vendor',
          email: account.email_of_who_added,
          phone: '',
          website: '',
          address: '',
          notes: '',
          status: 'active',
          balance: 0,
          created_at: account.created_at || '',
          updated_at: account.updated_at || '',
        }));
        
        return accounts;
      } catch (err) {
        console.error('Error fetching accounts:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch accounts';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    }
  });
  
  return {
    accounts: accountsQuery.data || [],
    isLoading: accountsQuery.isLoading,
    isError: accountsQuery.isError,
    error: accountsQuery.error
  };
}
