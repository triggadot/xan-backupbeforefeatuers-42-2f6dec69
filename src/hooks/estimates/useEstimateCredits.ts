import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/utils/use-toast';
import { 
  addCustomerCredit as addCustomerCreditService, 
  updateCustomerCredit as updateCustomerCreditService, 
  deleteCustomerCredit as deleteCustomerCreditService 
} from '@/services/supabase/tables/estimateService';
import { CustomerCredit } from '@/types/estimates/estimate';

export function useEstimateCredits() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCustomerCredit = useMutation({
    mutationFn: async ({ estimateGlideId, data }: { estimateGlideId: string, data: Partial<CustomerCredit> }): Promise<CustomerCredit> => {
      try {
        const newCredit = await addCustomerCreditService(estimateGlideId, data);
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate'] });
    }
  });

  const updateCustomerCredit = useMutation({
    mutationFn: async ({ creditId, data }: { creditId: string, data: Partial<CustomerCredit> }): Promise<CustomerCredit> => {
      try {
        const updatedCredit = await updateCustomerCreditService(creditId, data);
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate'] });
    }
  });

  const deleteCustomerCredit = useMutation({
    mutationFn: async (creditId: string): Promise<boolean> => {
      try {
        await deleteCustomerCreditService(creditId);
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate'] });
    }
  });

  return {
    addCustomerCredit,
    updateCustomerCredit,
    deleteCustomerCredit,
    isLoading,
    error
  };
} 