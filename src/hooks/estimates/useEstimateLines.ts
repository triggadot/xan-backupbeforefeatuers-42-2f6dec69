import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/utils/use-toast';
import { 
  addEstimateLine as addEstimateLineService, 
  updateEstimateLine as updateEstimateLineService, 
  deleteEstimateLine as deleteEstimateLineService 
} from '@/services/supabase/tables/estimateService';
import { EstimateLine } from '@/types/estimates/estimate';

export function useEstimateLines() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addEstimateLine = useMutation({
    mutationFn: async ({ estimateGlideId, data }: { estimateGlideId: string, data: Partial<EstimateLine> }): Promise<EstimateLine> => {
      try {
        const newLine = await addEstimateLineService(estimateGlideId, data);
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate'] });
    }
  });

  const updateEstimateLine = useMutation({
    mutationFn: async ({ lineId, data }: { lineId: string, data: Partial<EstimateLine> }): Promise<EstimateLine> => {
      try {
        const updatedLine = await updateEstimateLineService(lineId, data);
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate'] });
    }
  });

  const deleteEstimateLine = useMutation({
    mutationFn: async (lineId: string): Promise<boolean> => {
      try {
        await deleteEstimateLineService(lineId);
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate'] });
    }
  });

  return {
    addEstimateLine,
    updateEstimateLine,
    deleteEstimateLine,
    isLoading,
    error
  };
} 