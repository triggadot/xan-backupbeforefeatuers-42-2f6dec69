import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/utils/use-toast';
import { Account } from '@/types/accounts';

/**
 * Hook for fetching detailed account information with related data
 * Uses the Glidebase pattern where relationships use rowid_ fields referencing glide_row_id values
 * 
 * @param id - The UUID of the account to fetch
 * @returns Object containing account data and related information
 * 
 * @example
 * // Fetch account details
 * const { account, isLoading } = useAccountDetail('123e4567-e89b-12d3-a456-426614174000');
 */
export function useAccountDetail(id?: string) {
  const { toast } = useToast();
  
  const accountQuery = useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      if (!id) return null;
      
      try {
        // Fetch account data
        const { data: account, error: accountError } = await supabase
          .from('gl_accounts')
          .select('*')
          .eq('id', id)
          .single();
        
        if (accountError) throw accountError;
        
        if (!account) throw new Error('Account not found');
        
        // Fetch related invoices
        const { data: invoices, error: invoicesError } = await supabase
          .from('gl_invoices')
          .select('*')
          .eq('rowid_accounts', account.glide_row_id);
        
        if (invoicesError) throw invoicesError;
        
        // Fetch related products (if this is a vendor account)
        const { data: products, error: productsError } = await supabase
          .from('gl_products')
          .select('*')
          .eq('rowid_accounts', account.glide_row_id);
        
        if (productsError) throw productsError;
        
        // Fetch related purchase orders
        const { data: purchaseOrders, error: purchaseOrdersError } = await supabase
          .from('gl_purchase_orders')
          .select('*')
          .eq('rowid_accounts', account.glide_row_id);
        
        if (purchaseOrdersError) throw purchaseOrdersError;
        
        // Calculate account statistics
        const totalInvoices = invoices?.length || 0;
        const totalProducts = products?.length || 0;
        const totalPurchaseOrders = purchaseOrders?.length || 0;
        const totalInvoiceAmount = invoices?.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0) || 0;
        const totalPaid = invoices?.reduce((sum, invoice) => sum + (invoice.total_paid || 0), 0) || 0;
        const balance = totalInvoiceAmount - totalPaid;
        
        // Map account data to expected format
        const mappedAccount: Account = {
          id: account.id,
          name: account.account_name,
          type: account.client_type === 'Vendor' ? 'vendor' : 'customer',
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
          balance: account.balance || 0
        };
        
        // Return account with related data
        return {
          account: mappedAccount,
          relatedData: {
            invoices: invoices || [],
            products: products || [],
            purchaseOrders: purchaseOrders || [],
            stats: {
              totalInvoices,
              totalProducts,
              totalPurchaseOrders,
              totalInvoiceAmount,
              totalPaid,
              balance
            }
          }
        };
      } catch (err) {
        console.error('Error fetching account details:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch account details';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    enabled: !!id
  });
  
  // Get account by ID (for imperative calls)
  const getAccount = useCallback(async (accountId: string) => {
    if (!accountId) return null;
    
    try {
      const { data, error } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('id', accountId)
        .single();
      
      if (error) throw error;
      
      if (!data) throw new Error('Account not found');
      
      // Map to expected format
      const mappedAccount: Account = {
        id: data.id,
        name: data.account_name,
        type: data.client_type === 'Vendor' ? 'vendor' : 'customer',
        is_customer: data.client_type === 'Customer' || data.client_type === 'Customer & Vendor',
        is_vendor: data.client_type === 'Vendor' || data.client_type === 'Customer & Vendor',
        email: data.email_of_who_added,
        phone: '',
        website: '',
        address: '',
        notes: '',
        status: 'active',
        created_at: data.created_at,
        updated_at: data.updated_at,
        glide_row_id: data.glide_row_id,
        accounts_uid: data.accounts_uid,
        balance: data.balance || 0
      };
      
      return mappedAccount;
    } catch (err) {
      console.error('Error fetching account:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch account';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);
  
  return {
    account: accountQuery.data?.account,
    relatedData: accountQuery.data?.relatedData,
    isLoading: accountQuery.isLoading,
    isError: accountQuery.isError,
    error: accountQuery.error,
    getAccount
  };
}
