
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Estimate, EstimateLine, CustomerCredit } from '@/types/estimate';
import * as estimateService from '@/services/estimateService';

export function useEstimates() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEstimates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Step 1: Fetch the basic estimate data
      const estimatesData = await estimateService.fetchEstimatesList();
      
      // Step 2: Enhance each estimate with account info
      const enhancedEstimates = await Promise.all(
        estimatesData.map(async (estimate) => {
          const account = await estimateService.fetchEstimateAccount(estimate.rowid_accounts);
          
          // Cast to the expected enum type
          const status = estimate.status as 'draft' | 'pending' | 'converted';
          
          return {
            ...estimate,
            accountName: account?.account_name || 'Unknown',
            status: status
          } as Estimate;
        })
      );
      
      setEstimates(enhancedEstimates);
      return enhancedEstimates;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch estimates';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error fetching estimates:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getEstimate = useCallback(async (id: string): Promise<Estimate | null> => {
    try {
      const estimate = await estimateService.fetchEstimateDetails(id);
      
      if (!estimate) {
        throw new Error('Failed to fetch estimate details');
      }
      
      return estimate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch estimate';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error fetching estimate:', err);
      return null;
    }
  }, [toast]);

  const createEstimate = useCallback(async (estimateData: Partial<Estimate>) => {
    try {
      const newEstimate = await estimateService.createEstimateRecord(estimateData);
      
      toast({
        title: 'Success',
        description: 'Estimate created successfully',
      });
      
      await fetchEstimates();
      return newEstimate as Estimate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create estimate';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [fetchEstimates, toast]);

  const updateEstimate = useCallback(async (id: string, estimateData: Partial<Estimate>) => {
    try {
      const updated = await estimateService.updateEstimateRecord(id, estimateData);
      
      toast({
        title: 'Success',
        description: 'Estimate updated successfully',
      });
      
      await fetchEstimates();
      return updated as Estimate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update estimate';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [fetchEstimates, toast]);

  const deleteEstimate = useCallback(async (id: string) => {
    try {
      await estimateService.deleteEstimateRecord(id);
      
      toast({
        title: 'Success',
        description: 'Estimate deleted successfully',
      });
      
      await fetchEstimates();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete estimate';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchEstimates, toast]);

  const addEstimateLine = useCallback(async (estimateGlideId: string, lineData: Partial<EstimateLine>) => {
    try {
      const newLine = await estimateService.addEstimateLine(estimateGlideId, lineData);
      
      toast({
        title: 'Success',
        description: 'Estimate line added successfully',
      });
      
      return newLine as EstimateLine;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add estimate line';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const updateEstimateLine = useCallback(async (lineId: string, lineData: Partial<EstimateLine>) => {
    try {
      const updated = await estimateService.updateEstimateLine(lineId, lineData);
      
      toast({
        title: 'Success',
        description: 'Estimate line updated successfully',
      });
      
      return updated as EstimateLine;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update estimate line';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const deleteEstimateLine = useCallback(async (lineId: string) => {
    try {
      await estimateService.deleteEstimateLine(lineId);
      
      toast({
        title: 'Success',
        description: 'Estimate line removed successfully',
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove estimate line';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const addCustomerCredit = useCallback(async (estimateGlideId: string, creditData: Partial<CustomerCredit>) => {
    try {
      const newCredit = await estimateService.addCustomerCredit(estimateGlideId, creditData);
      
      toast({
        title: 'Success',
        description: 'Credit added successfully',
      });
      
      return newCredit as CustomerCredit;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add credit';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const updateCustomerCredit = useCallback(async (creditId: string, creditData: Partial<CustomerCredit>) => {
    try {
      const updated = await estimateService.updateCustomerCredit(creditId, creditData);
      
      toast({
        title: 'Success',
        description: 'Credit updated successfully',
      });
      
      return updated as CustomerCredit;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update credit';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const deleteCustomerCredit = useCallback(async (creditId: string) => {
    try {
      await estimateService.deleteCustomerCredit(creditId);
      
      toast({
        title: 'Success',
        description: 'Credit removed successfully',
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove credit';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const convertToInvoice = useCallback(async (estimateId: string) => {
    try {
      const invoice = await estimateService.convertEstimateToInvoice(estimateId);
      
      toast({
        title: 'Success',
        description: 'Estimate converted to invoice successfully',
      });
      
      await fetchEstimates();
      return invoice;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to convert estimate to invoice';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [fetchEstimates, toast]);

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);

  return {
    estimates,
    isLoading,
    error,
    fetchEstimates,
    getEstimate,
    createEstimate,
    updateEstimate,
    deleteEstimate,
    addEstimateLine,
    updateEstimateLine,
    deleteEstimateLine,
    addCustomerCredit,
    updateCustomerCredit,
    deleteCustomerCredit,
    convertToInvoice
  };
}
