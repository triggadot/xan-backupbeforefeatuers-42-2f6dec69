import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EstimateWithDetails } from '@/types/estimate';
import { GlAccount } from '@/types';

export function useEstimateDetail(estimateId: string | undefined) {
  const [estimate, setEstimate] = useState<EstimateWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (estimateId) {
      fetchEstimateDetail(estimateId);
    }
  }, [estimateId]);

  const fetchEstimateDetail = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch the estimate
      const { data: estimateData, error: estimateError } = await supabase
        .from('gl_estimates')
        .select('*')
        .eq('id', id)
        .single();

      if (estimateError) throw estimateError;
      if (!estimateData) throw new Error('Estimate not found');

      // Fetch account information
      let account = null;
      if (estimateData.rowid_accounts) {
        const { data: accountData, error: accountError } = await supabase
          .from('gl_accounts')
          .select('*')
          .eq('glide_row_id', estimateData.rowid_accounts)
          .single();

        if (accountError) {
          console.error('Error fetching account:', accountError);
        } else if (accountData) {
          account = accountData;
        }
      }

      // Fetch estimate lines
      const { data: lineData, error: lineError } = await supabase
        .from('gl_estimate_lines')
        .select('*')
        .eq('rowid_estimates', estimateData.glide_row_id);

      if (lineError) {
        console.error('Error fetching estimate lines:', lineError);
      }

      // Fetch product information for each line
      const lines = lineData || [];
      const lineItems = await Promise.all(
        lines.map(async (line) => {
          if (line.rowid_products) {
            const { data: productData, error: productError } = await supabase
              .from('gl_products')
              .select('*')
              .eq('glide_row_id', line.rowid_products)
              .single();

            if (productError) {
              console.error('Error fetching product:', productError);
              return line;
            }

            return {
              ...line,
              productDetails: productData
            };
          }
          return line;
        })
      );

      // Fetch credits
      const { data: creditData, error: creditError } = await supabase
        .from('gl_customer_credits')
        .select('*')
        .eq('rowid_estimates', estimateData.glide_row_id);

      if (creditError) {
        console.error('Error fetching credits:', creditError);
      }

      // Combine all data
      const estimateWithDetails: EstimateWithDetails = {
        ...estimateData,
        estimateLines: lineItems,
        credits: creditData || [],
        account: account
      };

      setEstimate(estimateWithDetails);
    } catch (err) {
      console.error('Error in fetchEstimateDetail:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching estimate details');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshEstimate = () => {
    if (estimateId) {
      fetchEstimateDetail(estimateId);
    }
  };

  const convertToInvoice = async () => {
    if (!estimate) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Update the estimate status to 'converted'
      const { error: updateError } = await supabase
        .from('gl_estimates')
        .update({ 
          status: 'converted',
          valid_final_create_invoice_clicked: true,
          date_invoice_created_date: new Date().toISOString()
        })
        .eq('id', estimate.id);
        
      if (updateError) throw updateError;
      
      // Refresh the estimate data
      refreshEstimate();
      
      return { success: true };
    } catch (err) {
      console.error('Error converting estimate to invoice:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while converting estimate to invoice');
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    estimate,
    isLoading,
    error,
    refreshEstimate,
    convertToInvoice
  };
}
