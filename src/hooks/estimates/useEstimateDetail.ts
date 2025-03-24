import { useState } from 'react';
import { fetchEstimateDetails } from '@/services/estimateService';
import { EstimateWithDetails } from '@/types/estimate';

export function useEstimateDetail() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getEstimate = async (id: string): Promise<EstimateWithDetails | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const estimate = await fetchEstimateDetails(id);
      if (!estimate) {
        throw new Error('Estimate not found');
      }
      return estimate as EstimateWithDetails;
    } catch (err) {
      console.error('Error fetching estimate details:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getEstimate,
    isLoading,
    error
  };
} 