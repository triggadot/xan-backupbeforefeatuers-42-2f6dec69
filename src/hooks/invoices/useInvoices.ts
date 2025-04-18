
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { InvoiceWithAccount } from '@/types/invoices/invoice';

interface InvoicesQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  customerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Hook to fetch invoices with pagination and filtering
 */
export function useInvoices({
  page = 1,
  pageSize = 10,
  status,
  customerId,
  sortBy = 'created_at',
  sortOrder = 'desc'
}: InvoicesQueryParams = {}) {
  
  return useQuery({
    queryKey: ['invoices', page, pageSize, status, customerId, sortBy, sortOrder],
    queryFn: async () => {
      // Calculate offset based on page and pageSize
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Start building the query
      let query = supabase
        .from('gl_invoices')
        .select(`
          *,
          account:rowid_accounts(*)
        `, { count: 'exact' });
      
      // Apply filters if provided
      if (status) {
        query = query.eq('payment_status', status);
      }
      
      if (customerId) {
        query = query.eq('rowid_accounts', customerId);
      }
      
      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      
      // Apply pagination
      query = query.range(from, to);
      
      // Execute query
      const { data, error, count } = await query;
      
      if (error) {
        throw new Error(error.message);
      }
      
      return {
        invoices: data as InvoiceWithAccount[],
        totalCount: count || 0,
        pageCount: count ? Math.ceil(count / pageSize) : 0
      };
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}
