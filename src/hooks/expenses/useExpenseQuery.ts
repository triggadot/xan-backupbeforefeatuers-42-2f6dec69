
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesService } from '@/services/expenses-service';
import { ExpenseForm, ExpenseFilters } from '@/types/expenses';
import { toast } from 'sonner';

export function useExpenseQuery(filters: ExpenseFilters = {}) {
  const queryClient = useQueryClient();

  const {
    data: expenses = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => expensesService.getExpenses(filters)
  });

  const createExpense = useMutation({
    mutationFn: (newExpense: ExpenseForm) => expensesService.createExpense(newExpense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create expense: ' + error.message);
    }
  });

  const updateExpense = useMutation({
    mutationFn: ({ id, expense }: { id: string; expense: Partial<ExpenseForm> }) =>
      expensesService.updateExpense(id, expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update expense: ' + error.message);
    }
  });

  const deleteExpense = useMutation({
    mutationFn: (id: string) => expensesService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete expense: ' + error.message);
    }
  });

  return {
    expenses,
    isLoading,
    error,
    createExpense,
    updateExpense,
    deleteExpense
  };
}
