
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Expense, ExpenseFilters } from '@/types/expenses';

export const useExpenses = (initialFilters?: ExpenseFilters) => {
  const [filters, setFilters] = useState<ExpenseFilters>(initialFilters || {});
  
  const {
    data: expenses,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: async (): Promise<Expense[]> => {
      let query = supabase
        .from('gl_expenses')
        .select('*');
      
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.minAmount) {
        query = query.gte('amount', filters.minAmount);
      }
      
      if (filters.maxAmount) {
        query = query.lte('amount', filters.maxAmount);
      }
      
      if (filters.searchTerm) {
        query = query.or(`notes.ilike.%${filters.searchTerm}%,category.ilike.%${filters.searchTerm}%,expense_supplier_name.ilike.%${filters.searchTerm}%`);
      }
      
      const { data, error } = await query.order('date', { ascending: false });
      
      if (error) {
        throw new Error(`Error fetching expenses: ${error.message}`);
      }
      
      return data.map(expense => ({
        id: expense.id,
        glideRowId: expense.glide_row_id,
        submittedBy: expense.submitted_by,
        notes: expense.notes,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        expenseReceiptImage: expense.expense_receipt_image,
        expenseSupplierName: expense.expense_supplier_name,
        createdAt: expense.created_at,
        updatedAt: expense.updated_at,
      } as Expense));
    },
    enabled: true
  });
  
  const updateFilters = (newFilters: Partial<ExpenseFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };
  
  const clearFilters = () => {
    setFilters({});
  };
  
  return {
    expenses: expenses || [],
    isLoading,
    isError,
    error,
    filters,
    updateFilters,
    clearFilters,
    refetch
  };
};

export default useExpenses;
