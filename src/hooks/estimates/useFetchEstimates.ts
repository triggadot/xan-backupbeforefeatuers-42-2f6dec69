import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchEstimatesList } from '@/services/estimateService';
import { Estimate } from '@/types/estimate';

export function useFetchEstimates() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEstimates = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchEstimatesList();
      
      // Transform data to match our Estimate interface
      const transformedData = data.map((item: any): Estimate => {
        return {
          id: item.id,
          glide_row_id: item.glide_row_id,
          rowid_accounts: item.rowid_accounts,
          accountName: 'Unknown', // Will be populated later
          status: item.status as 'draft' | 'pending' | 'converted',
          total_amount: item.total_amount || 0,
          total_credits: item.total_credits || 0,
          balance: item.balance || 0,
          estimate_date: item.estimate_date,
          valid_final_create_invoice_clicked: item.valid_final_create_invoice_clicked,
          is_a_sample: item.is_a_sample,
          glide_pdf_url: item.glide_pdf_url,
          created_at: item.created_at,
          updated_at: item.updated_at,
          add_note: item.add_note
        };
      });
      
      // Fetch account names for all estimates
      const estimatesWithAccounts = await Promise.all(
        transformedData.map(async (estimate) => {
          if (estimate.rowid_accounts) {
            try {
              const { data: accountData } = await supabase
                .from('gl_accounts')
                .select('account_name')
                .eq('glide_row_id', estimate.rowid_accounts)
                .single();
              
              return {
                ...estimate,
                accountName: accountData?.account_name || 'Unknown'
              };
            } catch (error) {
              console.error('Error fetching account for estimate:', error);
              return estimate;
            }
          }
          return estimate;
        })
      );
      
      return { data: estimatesWithAccounts, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching estimates';
      setError(errorMessage);
      console.error('Error fetching estimates:', err);
      return { data: null, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchEstimates,
    isLoading,
    error
  };
} 