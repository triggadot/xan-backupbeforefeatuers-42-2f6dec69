/**
 * Hook for fetching and managing expenses data
 * 
 * @module hooks/expenses
 */
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlExpense, ExpenseFilters, Expense } from '@/types/expenses';

/**
 * Hook for fetching and filtering expense data
 * 
 * @param initialFilters - Initial filter values for the expenses query
 * @returns Object containing expenses data, loading state, error state, and filter management functions
 */
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
      
      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
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
      
      // Sort by date, newest first
      query = query.order('date', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Error fetching expenses: ${error.message}`);
      }
      
      // Process the data
      return (data as GlExpense[]).map(expense => ({
        ...expense,
        formattedAmount: expense.amount ? 
          new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(expense.amount)) 
          : '$0.00',
        formattedDate: expense.date ? 
          new Date(expense.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) 
          : ''
      }));
    },
    // Enable query by default
    enabled: true
  });
  
  /**
   * Updates the current filters
   * 
   * @param newFilters - New filter values to apply
   */
  const updateFilters = (newFilters: ExpenseFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };
  
  /**
   * Clears all active filters
   */
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
