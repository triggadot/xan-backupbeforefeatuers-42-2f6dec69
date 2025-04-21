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
  rowid_estimates?: string;
  rowid_invoices?: string;
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
        let { data: account, error: accountError } = await supabase
          .from('gl_accounts')
          .select('*')
          .eq('id', accountId)
          .single();
        
        if (accountError) throw accountError;
        if (!account) throw new Error('Account not found');
        
        // 1. Fetch primary data (invoices)
        let { data: unpaidInvoicesData, error: invoicesError } = await supabase
          .from('gl_invoices')
          .select('*')
          .eq('rowid_accounts', account.glide_row_id)
          .neq('balance', 0); // Fetch invoices where balance is not zero
        
        if (invoicesError) throw invoicesError;
        let unpaidInvoices = unpaidInvoicesData || [];
        
        // 2. Fetch invoice lines
        let invoiceLines: any[] = [];
        if (unpaidInvoices.length > 0) {
          const invoiceIds = unpaidInvoices.map(invoice => invoice.glide_row_id);
          
          const { data: lines, error: linesError } = await supabase
            .from('gl_invoice_lines')
            .select('*')
            .in('rowid_invoices', invoiceIds);
          
          if (linesError) throw linesError;
          invoiceLines = lines || [];
          
          // 3. Fetch products for invoice lines
          const productIds = invoiceLines
            .map(line => line.rowid_products)
            .filter(Boolean);
          
          let products: any[] = [];
          if (productIds.length > 0) {
            const { data: productsData, error: productsError } = await supabase
              .from('gl_products')
              .select('*')
              .in('glide_row_id', productIds);
            
            if (productsError) throw productsError;
            products = productsData || [];
          }
          
          // 4. Create lookup maps
          const productMap = new Map();
          products.forEach(product => {
            productMap.set(product.glide_row_id, product);
          });
          
          // 5. Manually join data
          // Attach products to lines
          invoiceLines = invoiceLines.map(line => {
            const product = line.rowid_products ? productMap.get(line.rowid_products) : null;
            return {
              ...line,
              product
            };
          });
          
          // Group lines by invoice
          const linesByInvoice = new Map();
          invoiceLines.forEach(line => {
            if (!linesByInvoice.has(line.rowid_invoices)) {
              linesByInvoice.set(line.rowid_invoices, []);
            }
            linesByInvoice.get(line.rowid_invoices).push(line);
          });
          
          // Attach lines to invoices
          unpaidInvoices = unpaidInvoices.map(invoice => {
            return {
              ...invoice,
              lines: linesByInvoice.get(invoice.glide_row_id) || []
            };
          });
        }
        
        // Fetch sample estimates for this account
        let { data: sampleEstimatesData, error: estimatesError } = await supabase
          .from('gl_estimates')
          .select('*')
          .eq('rowid_accounts', account.glide_row_id)
          .eq('is_a_sample', true);
        
        if (estimatesError) throw estimatesError;
        let sampleEstimates = sampleEstimatesData || [];
        
        // Get all estimate IDs for later use with credits
        const allEstimateIds = sampleEstimates.map(estimate => estimate.glide_row_id);
        
        // Fetch estimate lines
        let estimateLines: any[] = [];
        if (sampleEstimates.length > 0) {
          const estimateIds = sampleEstimates.map(estimate => estimate.glide_row_id);
          
          const { data: lines, error: linesError } = await supabase
            .from('gl_estimate_lines')
            .select('*')
            .in('rowid_estimates', estimateIds);
          
          if (linesError) throw linesError;
          estimateLines = lines || [];
          
          // Fetch products for estimate lines
          const productIds = estimateLines
            .map(line => line.rowid_products)
            .filter(Boolean);
          
          let products: any[] = [];
          if (productIds.length > 0) {
            const { data: productsData, error: productsError } = await supabase
              .from('gl_products')
              .select('*')
              .in('glide_row_id', productIds);
            
            if (productsError) throw productsError;
            products = productsData || [];
          }
          
          // Create lookup maps
          const productMap = new Map();
          products.forEach(product => {
            productMap.set(product.glide_row_id, product);
          });
          
          // Manually join data
          // Attach products to lines
          estimateLines = estimateLines.map(line => {
            const product = line.rowid_products ? productMap.get(line.rowid_products) : null;
            return {
              ...line,
              product
            };
          });
          
          // Group lines by estimate
          const linesByEstimate = new Map();
          estimateLines.forEach(line => {
            if (!linesByEstimate.has(line.rowid_estimates)) {
              linesByEstimate.set(line.rowid_estimates, []);
            }
            linesByEstimate.get(line.rowid_estimates).push(line);
          });
          
          // Attach lines to estimates
          sampleEstimates = sampleEstimates.map(estimate => {
            return {
              ...estimate,
              lines: linesByEstimate.get(estimate.glide_row_id) || []
            };
          });
        }
        
        // Get all invoice IDs for payments (only open invoices)
        const openInvoiceIds = unpaidInvoices.map(invoice => invoice.glide_row_id);
        
        // Fetch payments for this account's open invoices
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('gl_customer_payments')
          .select('*')
          .eq('rowid_accounts', account.glide_row_id)
          .in('rowid_invoices', openInvoiceIds.length > 0 ? openInvoiceIds : ['']);
        
        if (paymentsError) throw paymentsError;
        const payments = paymentsData || [];
        
        // Fetch credits related to the account's estimates
        const { data: creditsData, error: creditsError } = await supabase
          .from('gl_customer_credits')
          .select('*')
          .eq('rowid_accounts', account.glide_row_id)
          .in('rowid_estimates', allEstimateIds.length > 0 ? allEstimateIds : ['']);
        
        if (creditsError) throw creditsError;
        const credits = creditsData || [];
        
        // Calculate totals for UI display purposes
        const totalUnpaid = unpaidInvoices?.reduce(
          (sum, invoice) => sum + (invoice.balance || 0), 
          0
        ) || 0;
        
        // Only count payments related to open invoices
        const totalPaid = payments?.reduce(
          (sum, payment) => sum + (payment.payment_amount || 0), 
          0
        ) || 0;
        
        // Only count credits related to estimates
        const totalCredits = credits?.reduce(
          (sum, credit) => sum + (credit.credit_amount || 0), 
          0
        ) || 0;
        
        // Use the balance directly from the account record instead of calculating it
        const totalBalance = account.balance || 0;
        
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
          balance: account.balance || 0, // Use balance directly from account record
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
