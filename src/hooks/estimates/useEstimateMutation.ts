import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  createEstimateRecord, 
  updateEstimateRecord, 
  deleteEstimateRecord,
  convertEstimateToInvoice
} from '@/services/estimateService';
import { Estimate } from '@/types/estimate';

export function useEstimateMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createEstimate = useMutation({
    mutationFn: async (data: Partial<Estimate>): Promise<Estimate> => {
      try {
        const newEstimate = await createEstimateRecord(data);
        toast({
          title: 'Success',
          description: 'Estimate created successfully',
        });
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    }
  });

  const updateEstimate = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Estimate> & { id: string }): Promise<Estimate> => {
      try {
        const updatedEstimate = await updateEstimateRecord(id, data);
        toast({
          title: 'Success',
          description: 'Estimate updated successfully',
        });
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate'] });
    }
  });

  const deleteEstimate = useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      try {
        await deleteEstimateRecord(id);
        toast({
          title: 'Success',
          description: 'Estimate deleted successfully',
        });
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    }
  });

  const convertToInvoice = useMutation({
    mutationFn: async (id: string): Promise<any> => {
      try {
        const result = await convertEstimateToInvoice(id);
        toast({
          title: 'Success',
          description: 'Estimate converted to invoice successfully',
        });
        return result;
      } catch (err) {
        console.error('Error converting estimate to invoice:', err);
        toast({
          title: 'Error',
          description: 'Failed to convert estimate to invoice',
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });

  return {
    createEstimate,
    updateEstimate,
    deleteEstimate,
    convertToInvoice
  };
} 