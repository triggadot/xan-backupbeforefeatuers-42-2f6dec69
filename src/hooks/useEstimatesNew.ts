
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Estimate, EstimateWithDetails, EstimateLine, CustomerCredit } from '@/types/estimate';
import { fetchEstimateDetails, createEstimateRecord, updateEstimateRecord, deleteEstimateRecord, 
  addEstimateLine, updateEstimateLine, deleteEstimateLine, 
  addCustomerCredit, updateCustomerCredit, deleteCustomerCredit, 
  convertEstimateToInvoice, fetchEstimatesList } from '@/services/estimateService';

export function useEstimatesNew() {
  const { toast } = useToast();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      
      setEstimates(estimatesWithAccounts);
    } catch (err) {
      console.error('Error fetching estimates:', err);
      setError('Failed to load estimates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load estimates on hook mount
  useEffect(() => {
    fetchEstimates();
  }, []);

  const getEstimate = async (id: string): Promise<EstimateWithDetails> => {
    try {
      const estimate = await fetchEstimateDetails(id);
      if (!estimate) {
        throw new Error('Estimate not found');
      }
      return estimate as EstimateWithDetails;
    } catch (err) {
      console.error('Error fetching estimate details:', err);
      throw new Error('Could not fetch estimate details');
    }
  };

  const createEstimate = {
    mutateAsync: async (data: Partial<Estimate>) => {
      try {
        const newEstimate = await createEstimateRecord(data);
        toast({
          title: 'Success',
          description: 'Estimate created successfully',
        });
        await fetchEstimates(); // Refresh the list
        return newEstimate;
      } catch (err) {
        console.error('Error creating estimate:', err);
        toast({
          title: 'Error',
          description: 'Failed to create estimate',
          variant: 'destructive',
        });
        throw err;
      }
    }
  };

  const updateEstimate = {
    mutateAsync: async (data: Partial<Estimate> & { id: string }) => {
      try {
        const updatedEstimate = await updateEstimateRecord(data.id, data);
        toast({
          title: 'Success',
          description: 'Estimate updated successfully',
        });
        await fetchEstimates(); // Refresh the list
        return updatedEstimate;
      } catch (err) {
        console.error('Error updating estimate:', err);
        toast({
          title: 'Error',
          description: 'Failed to update estimate',
          variant: 'destructive',
        });
        throw err;
      }
    }
  };

  const deleteEstimate = {
    mutateAsync: async (id: string) => {
      try {
        await deleteEstimateRecord(id);
        toast({
          title: 'Success',
          description: 'Estimate deleted successfully',
        });
        setEstimates(prev => prev.filter(estimate => estimate.id !== id));
        return true;
      } catch (err) {
        console.error('Error deleting estimate:', err);
        toast({
          title: 'Error',
          description: 'Failed to delete estimate',
          variant: 'destructive',
        });
        throw err;
      }
    }
  };

  const addEstimateLine = {
    mutateAsync: async ({ estimateGlideId, data }: { estimateGlideId: string, data: Partial<EstimateLine> }) => {
      try {
        const newLine = await addEstimateLine(estimateGlideId, data);
        toast({
          title: 'Success',
          description: 'Line item added successfully',
        });
        return newLine;
      } catch (err) {
        console.error('Error adding line item:', err);
        toast({
          title: 'Error',
          description: 'Failed to add line item',
          variant: 'destructive',
        });
        throw err;
      }
    }
  };

  const updateEstimateLine = {
    mutateAsync: async ({ lineId, data }: { lineId: string, data: Partial<EstimateLine> }) => {
      try {
        const updatedLine = await updateEstimateLine(lineId, data);
        toast({
          title: 'Success',
          description: 'Line item updated successfully',
        });
        return updatedLine;
      } catch (err) {
        console.error('Error updating line item:', err);
        toast({
          title: 'Error',
          description: 'Failed to update line item',
          variant: 'destructive',
        });
        throw err;
      }
    }
  };

  const deleteEstimateLine = {
    mutateAsync: async (lineId: string) => {
      try {
        await deleteEstimateLine(lineId);
        toast({
          title: 'Success',
          description: 'Line item deleted successfully',
        });
        return true;
      } catch (err) {
        console.error('Error deleting line item:', err);
        toast({
          title: 'Error',
          description: 'Failed to delete line item',
          variant: 'destructive',
        });
        throw err;
      }
    }
  };

  const addCustomerCredit = {
    mutateAsync: async ({ estimateGlideId, data }: { estimateGlideId: string, data: Partial<CustomerCredit> }) => {
      try {
        const newCredit = await addCustomerCredit(estimateGlideId, data);
        toast({
          title: 'Success',
          description: 'Credit added successfully',
        });
        return newCredit;
      } catch (err) {
        console.error('Error adding credit:', err);
        toast({
          title: 'Error',
          description: 'Failed to add credit',
          variant: 'destructive',
        });
        throw err;
      }
    }
  };

  const updateCustomerCredit = {
    mutateAsync: async ({ creditId, data }: { creditId: string, data: Partial<CustomerCredit> }) => {
      try {
        const updatedCredit = await updateCustomerCredit(creditId, data);
        toast({
          title: 'Success',
          description: 'Credit updated successfully',
        });
        return updatedCredit;
      } catch (err) {
        console.error('Error updating credit:', err);
        toast({
          title: 'Error',
          description: 'Failed to update credit',
          variant: 'destructive',
        });
        throw err;
      }
    }
  };

  const deleteCustomerCredit = {
    mutateAsync: async (creditId: string) => {
      try {
        await deleteCustomerCredit(creditId);
        toast({
          title: 'Success',
          description: 'Credit deleted successfully',
        });
        return true;
      } catch (err) {
        console.error('Error deleting credit:', err);
        toast({
          title: 'Error',
          description: 'Failed to delete credit',
          variant: 'destructive',
        });
        throw err;
      }
    }
  };

  const convertToInvoice = {
    mutateAsync: async (id: string) => {
      try {
        const invoice = await convertEstimateToInvoice(id);
        toast({
          title: 'Success',
          description: 'Estimate converted to invoice successfully',
        });
        await fetchEstimates(); // Refresh the list
        return invoice;
      } catch (err) {
        console.error('Error converting to invoice:', err);
        toast({
          title: 'Error',
          description: 'Failed to convert estimate to invoice',
          variant: 'destructive',
        });
        throw err;
      }
    }
  };

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
