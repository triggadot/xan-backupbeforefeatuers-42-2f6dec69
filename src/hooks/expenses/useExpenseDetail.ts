/**
 * Hook for fetching detailed information about a specific expense
 * 
 * @module hooks/expenses
 */
import { useQuery } from '@tanstack/react-query';
import { glExpensesService } from '@/services/supabase';
import { Expense } from '@/types/expenses';

/**
 * Hook for fetching detailed information about a specific expense
 * 
 * @param id - The UUID of the expense to fetch
 * @returns Object containing expense detail data, loading state, and error state
 */
export const useExpenseDetail = (id: string | undefined) => {
  const {
    data: expense,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['expense', id],
    queryFn: async (): Promise<Expense | null> => {
      if (!id) return null;
      
      // Use the service instead of direct Supabase query
      return await glExpensesService.getExpense(id);
    },
    enabled: !!id
  });
  
  return {
    expense,
    isLoading,
    isError,
    error,
    refetch
  };
};

export default useExpenseDetail;
