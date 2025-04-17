import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/utils/use-toast';
import { Account, GlAccount } from '@/types/accounts';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

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
  
  // Get accounts query
  const accountsQuery = useQuery({
    queryKey: ['accounts', filters],
    queryFn: async () => {
      try {
        // Build base query
        let query = supabase
          .from('gl_accounts')
          .select(`
            *,
            gl_invoices!rowid_accounts(
              id,
              total_amount,
              total_paid,
              balance
            )
          `);
        
        // Apply client_type filter
        if (filters?.client_type) {
          query = query.eq('client_type', filters.client_type);
        }
        
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
        const accounts = (data || []).map((account: any): Account => {
          // Calculate account balance from related invoices
          let calculatedBalance = 0;
          if (account.gl_invoices && account.gl_invoices.length > 0) {
            calculatedBalance = account.gl_invoices.reduce((total: number, invoice: any) => {
              return total + (invoice.balance || 0);
            }, 0);
          }
          
          return {
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
            balance: calculatedBalance,
            created_at: account.created_at || '',
            updated_at: account.updated_at || '',
          };
        });
        
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
