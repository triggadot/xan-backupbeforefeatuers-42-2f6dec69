import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EstimateWithDetails, EstimateFilters } from '@/types/estimate';
import { GlAccount } from '@/types';

export function useEstimates(filters?: EstimateFilters) {
  const [estimates, setEstimates] = useState<EstimateWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEstimates();
  }, [filters]);

  const fetchEstimates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch estimates
      const { data: estimateData, error: estimateError } = await supabase
        .from('gl_estimates')
        .select('*')
        .order('created_at', { ascending: false });

      if (estimateError) throw estimateError;

      if (!estimateData || estimateData.length === 0) {
        setEstimates([]);
        setIsLoading(false);
        return;
      }

      // Fetch accounts to join with estimates
      const { data: accountData, error: accountError } = await supabase
        .from('gl_accounts')
        .select('*');

      if (accountError) throw accountError;

      // Fetch estimate lines
      const { data: lineData, error: lineError } = await supabase
        .from('gl_estimate_lines')
        .select('*');

      if (lineError) throw lineError;

      // Fetch credits
      const { data: creditData, error: creditError } = await supabase
        .from('gl_customer_credits')
        .select('*');

      if (creditError) throw creditError;

      // Create lookup maps for related data
      const accountMap = new Map();
      if (accountData) {
        accountData.forEach((account: GlAccount) => {
          accountMap.set(account.glide_row_id, account);
        });
      }

      // Group lines and credits by estimate
      const lineMap = new Map();
      if (lineData) {
        lineData.forEach((line) => {
          const lines = lineMap.get(line.rowid_estimates) || [];
          lines.push(line);
          lineMap.set(line.rowid_estimates, lines);
        });
      }

      const creditMap = new Map();
      if (creditData) {
        creditData.forEach((credit) => {
          if (credit.rowid_estimates) {
            const credits = creditMap.get(credit.rowid_estimates) || [];
            credits.push(credit);
            creditMap.set(credit.rowid_estimates, credits);
          }
        });
      }

      // Combine data
      const combinedEstimates = estimateData.map((estimate) => {
        const estimateWithDetails: EstimateWithDetails = {
          ...estimate,
          estimateLines: lineMap.get(estimate.glide_row_id) || [],
          credits: creditMap.get(estimate.glide_row_id) || []
        };

        // Add account information
        if (estimate.rowid_accounts) {
          const account = accountMap.get(estimate.rowid_accounts);
          if (account) {
            estimateWithDetails.account = account;
          }
        }

        return estimateWithDetails;
      });

      // Apply filters if provided
      let filteredEstimates = combinedEstimates;
      
      if (filters) {
        if (filters.status) {
          filteredEstimates = filteredEstimates.filter(
            (estimate) => estimate.status === filters.status
          );
        }
        
        if (filters.accountId) {
          filteredEstimates = filteredEstimates.filter(
            (estimate) => estimate.account?.id === filters.accountId
          );
        }
        
        if (filters.fromDate) {
          const fromDate = new Date(filters.fromDate);
          filteredEstimates = filteredEstimates.filter((estimate) => {
            if (!estimate.estimate_date) return true;
            return new Date(estimate.estimate_date) >= fromDate;
          });
        }
        
        if (filters.toDate) {
          const toDate = new Date(filters.toDate);
          filteredEstimates = filteredEstimates.filter((estimate) => {
            if (!estimate.estimate_date) return true;
            return new Date(estimate.estimate_date) <= toDate;
          });
        }
      }

      setEstimates(filteredEstimates);
    } catch (err) {
      console.error('Error fetching estimates:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching estimates');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    estimates,
    isLoading,
    error,
    fetchEstimates
  };
}
