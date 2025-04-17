
/**
 * Hook for fetching detailed information about a specific expense
 * 
 * @module hooks/expenses
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GlExpenseRecord, Expense } from '@/types/expenses';

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
      
      const { data, error } = await supabase
        .from('gl_expenses')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw new Error(`Error fetching expense detail: ${error.message}`);
      }
      
      if (!data) return null;
      
      // Process the data
      const expenseData = data as GlExpenseRecord;
      return {
        ...expenseData,
        formattedAmount: expenseData.amount ? 
          new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(expenseData.amount)) 
          : '$0.00',
        formattedDate: expenseData.date ? 
          new Date(expenseData.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) 
          : ''
      };
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
