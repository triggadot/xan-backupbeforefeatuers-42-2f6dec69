
import { useState } from 'react';
import { useFetchEstimates } from './useFetchEstimates';
import { useEstimateDetail } from './useEstimateDetail';
import { useEstimateLines } from './useEstimateLines';
import { useEstimateCredits } from './useEstimateCredits';
import { useEstimateMutation } from './useEstimateMutation';
import { EstimateFilters } from '@/types/estimate';

export function useEstimatesNew(filters?: EstimateFilters) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Import functionality from smaller hooks
  const { fetchEstimates: baseFetchEstimates } = useFetchEstimates();
  const { getEstimate } = useEstimateDetail();
  const { 
    addEstimateLine, 
    updateEstimateLine, 
    deleteEstimateLine 
  } = useEstimateLines();
  const { 
    addCustomerCredit, 
    updateCustomerCredit, 
    deleteCustomerCredit 
  } = useEstimateCredits();
  const { 
    createEstimate, 
    updateEstimate, 
    deleteEstimate, 
    convertToInvoice 
  } = useEstimateMutation();

  // Wrapper to apply filters (for future implementation)
  const fetchEstimates = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Here we could apply filters in the future
      const result = await baseFetchEstimates();
      if (result.error) {
        throw result.error;
      }
      return result.data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching estimates';
      setError(errorMessage);
      console.error('Error in useEstimatesNew.fetchEstimates:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Functions
    fetchEstimates,
    getEstimate,
    
    // Mutations
    createEstimate,
    updateEstimate,
    deleteEstimate,
    
    // Line items
    addEstimateLine,
    updateEstimateLine,
    deleteEstimateLine,
    
    // Credits
    addCustomerCredit,
    updateCustomerCredit,
    deleteCustomerCredit,
    
    // Invoice conversion
    convertToInvoice,
    
    // State
    isLoading,
    error
  };
}
