
import { useQuery } from '@tanstack/react-query';
import { getEstimateWithDetails } from '@/services/supabase/tables/estimateService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/utils/use-toast';
import { EstimateWithDetails, EstimateFilters } from '@/types/estimates/estimate';

/**
 * Hook for fetching and filtering estimates
 * @param filters - Optional filters to apply to the estimates query
 */
export function useEstimates(filters: EstimateFilters = {}) {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['estimates', filters],
    queryFn: async (): Promise<EstimateWithDetails[]> => {
      try {
        let query = supabase
          .from('gl_estimates')
          .select(`
            *,
            account:rowid_accounts(*)
          `);
        
        // Apply filters
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        
        if (filters.accountId) {
          query = query.eq('rowid_accounts', filters.accountId);
        }
        
        if (filters.fromDate) {
          query = query.gte('estimate_date', filters.fromDate);
        }
        
        if (filters.toDate) {
          query = query.lte('estimate_date', filters.toDate);
        }
        
        // Order by date descending so latest estimates appear first
        query = query.order('created_at', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        // For each estimate, fetch its lines and credits
        const estimatesWithDetails = await Promise.all(
          (data || []).map(async (estimate): Promise<EstimateWithDetails> => {
            // Fetch lines and credits for this estimate
            const [linesResult, creditsResult] = await Promise.all([
              supabase
                .from('gl_estimate_lines')
                .select('*')
                .eq('rowid_estimates', estimate.glide_row_id),
              supabase
                .from('gl_customer_credits')
                .select('*')
                .eq('rowid_estimates', estimate.glide_row_id)
            ]);
            
            return {
              ...estimate,
              estimateLines: linesResult.data || [],
              credits: creditsResult.data || [],
            } as EstimateWithDetails;
          })
        );
        
        return estimatesWithDetails;
      } catch (err) {
        console.error('Error fetching estimates:', err);
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to fetch estimates',
          variant: 'destructive',
        });
        return [];
      }
    }
  });
}
