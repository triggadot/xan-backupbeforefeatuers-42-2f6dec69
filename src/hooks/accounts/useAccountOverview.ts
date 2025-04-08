import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/utils/use-toast';
import { Account } from '@/types/accountNew';
import { InvoiceWithAccount } from '@/types/new/invoice';

/**
 * Interface for customer payments
 */
export interface CustomerPayment {
  id: string;
  glide_row_id: string;
  payment_date: string;
  payment_amount: number;
  payment_method?: string;
  notes?: string;
  rowid_invoices: string;
  rowid_accounts: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for credits
 */
export interface Credit {
  id: string;
  glide_row_id: string;
  credit_date: string;
  credit_amount: number;
  notes?: string;
  rowid_estimates: string;
  rowid_accounts: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for account overview data
 */
export interface AccountOverviewData {
  account: Account | null;
  unpaidInvoices: InvoiceWithAccount[];
  sampleEstimates: any[]; // Replace with proper type when available
  payments: CustomerPayment[];
  credits: Credit[];
  totalBalance: number;
  totalUnpaid: number;
  totalPaid: number;
}

/**
 * Hook for fetching account overview data including balances, unpaid invoices, and payments
 * Uses the Glidebase pattern where relationships use rowid_ fields referencing glide_row_id values
 * 
 * @param accountId - The UUID of the account to fetch overview data for
 * @returns Object containing account overview data and loading states
 */
export function useAccountOverview(accountId: string) {
  const { toast } = useToast();
  
  const overviewQuery = useQuery({
    queryKey: ['account-overview', accountId],
    queryFn: async (): Promise<AccountOverviewData> => {
      try {
        if (!accountId) {
          throw new Error('Account ID is required');
        }
        
        // Fetch account data
        const { data: account, error: accountError } = await supabase
          .from('gl_accounts')
          .select('*')
          .eq('id', accountId)
          .single();
        
        if (accountError) throw accountError;
        if (!account) throw new Error('Account not found');
        
        // Fetch unpaid invoices for this account
        const { data: unpaidInvoices, error: invoicesError } = await supabase
          .from('gl_invoices')
          .select(`
            *,
            account:gl_accounts!rowid_accounts(*)
          `)
          .eq('rowid_accounts', account.glide_row_id)
          .or('payment_status.eq.pending,payment_status.eq.overdue,payment_status.is.null');
        
        if (invoicesError) throw invoicesError;
        
        // Fetch sample estimates for this account
        const { data: sampleEstimates, error: estimatesError } = await supabase
          .from('gl_estimates')
          .select('*')
          .eq('rowid_accounts', account.glide_row_id)
          .eq('is_sample', true);
        
        if (estimatesError) throw estimatesError;
        
        // Fetch payments for this account
        const { data: payments, error: paymentsError } = await supabase
          .from('gl_customer_payments')
          .select('*')
          .eq('rowid_accounts', account.glide_row_id);
        
        if (paymentsError) throw paymentsError;
        
        // Fetch credits for this account
        const { data: credits, error: creditsError } = await supabase
          .from('gl_credits')
          .select('*')
          .eq('rowid_accounts', account.glide_row_id);
        
        if (creditsError) throw creditsError;
        
        // Calculate totals
        const totalUnpaid = unpaidInvoices?.reduce(
          (sum, invoice) => sum + (invoice.balance || 0), 
          0
        ) || 0;
        
        const totalPaid = payments?.reduce(
          (sum, payment) => sum + (payment.payment_amount || 0), 
          0
        ) || 0;
        
        const totalCredits = credits?.reduce(
          (sum, credit) => sum + (credit.credit_amount || 0), 
          0
        ) || 0;
        
        const totalBalance = totalUnpaid - totalPaid - totalCredits;
        
        // Map account data to expected format
        const mappedAccount: Account = {
          id: account.id,
          name: account.account_name,
          type: account.client_type as 'Customer' | 'Vendor' | 'Customer & Vendor',
          is_customer: account.client_type === 'Customer' || account.client_type === 'Customer & Vendor',
          is_vendor: account.client_type === 'Vendor' || account.client_type === 'Customer & Vendor',
          email: account.email_of_who_added,
          phone: '',
          website: '',
          address: '',
          notes: '',
          status: 'active',
          created_at: account.created_at,
          updated_at: account.updated_at,
          glide_row_id: account.glide_row_id,
          accounts_uid: account.accounts_uid,
          balance: totalBalance,
          photo: account.photo
        };
        
        return {
          account: mappedAccount,
          unpaidInvoices: unpaidInvoices || [],
          sampleEstimates: sampleEstimates || [],
          payments: payments || [],
          credits: credits || [],
          totalBalance,
          totalUnpaid,
          totalPaid
        };
      } catch (err) {
        console.error('Error fetching account overview:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch account overview';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    enabled: !!accountId
  });
  
  return {
    overview: overviewQuery.data,
    isLoading: overviewQuery.isLoading,
    isError: overviewQuery.isError,
    error: overviewQuery.error
  };
}
