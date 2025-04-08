import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/utils/use-toast';
import { Account } from '@/types/accountNew';

/**
 * Hook for fetching accounts with calculated balances
 * Uses the Glidebase pattern where relationships use rowid_ fields referencing glide_row_id values
 * 
 * @returns Object containing accounts data with proper balances
 */
export function useAccountsWithBalances() {
  const { toast } = useToast();
  
  const accountsQuery = useQuery({
    queryKey: ['accounts-with-balances'],
    queryFn: async () => {
      try {
        // Fetch accounts
        const { data: accounts, error: accountsError } = await supabase
          .from('gl_accounts')
          .select('*')
          .order('account_name');
        
        if (accountsError) throw accountsError;
        
        // Fetch all invoices to calculate balances
        const { data: invoices, error: invoicesError } = await supabase
          .from('gl_invoices')
          .select('id, rowid_accounts, total_amount, total_paid');
        
        if (invoicesError) throw invoicesError;
        
        // Map accounts and calculate balances
        const accountsWithBalances = accounts.map((account) => {
          // Find all invoices for this account
          const accountInvoices = invoices.filter(
            invoice => invoice.rowid_accounts === account.glide_row_id
          );
          
          // Calculate balance
          const totalInvoiceAmount = accountInvoices.reduce(
            (sum, invoice) => sum + (invoice.total_amount || 0), 
            0
          );
          
          const totalPaid = accountInvoices.reduce(
            (sum, invoice) => sum + (invoice.total_paid || 0), 
            0
          );
          
          const balance = totalInvoiceAmount - totalPaid;
          
          // Create account object with calculated balance
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
            balance: balance,
            created_at: account.created_at || '',
            updated_at: account.updated_at || '',
            photo: account.photo
          } as Account;
        });
        
        return accountsWithBalances;
      } catch (err) {
        console.error('Error fetching accounts with balances:', err);
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
