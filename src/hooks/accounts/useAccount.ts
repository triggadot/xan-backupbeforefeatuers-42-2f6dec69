import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch an account by its glide_row_id
 * 
 * @param accountGlideId - The Glide row ID of the account to fetch
 * @returns Query object containing the account data, loading state, and error
 * 
 * @example
 * ```tsx
 * const { data: account, isLoading, error } = useAccount('glide-123');
 * ```
 */
export function useAccount(accountGlideId: string | null | undefined) {
  return useQuery({
    queryKey: ['account', accountGlideId],
    queryFn: async () => {
      if (!accountGlideId) return null;
      
      const { data, error } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('glide_row_id', accountGlideId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!accountGlideId
  });
}
