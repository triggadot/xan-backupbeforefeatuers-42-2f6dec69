
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Expense, ExpenseFormData } from '@/types/expenses';

export const useExpenseMutation = () => {
  const queryClient = useQueryClient();

  const createExpense = useMutation({
    mutationFn: async (data: ExpenseFormData): Promise<Expense> => {
      // Generate a glideRowId for new expenses
      const glideRowId = `glexp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
      
      const { data: newExpense, error } = await supabase
        .from('gl_expenses')
        .insert({
          glide_row_id: glideRowId,
          notes: data.notes,
          amount: data.amount,
          category: data.category,
          date: data.date,
          expense_supplier_name: data.supplierName,
          expense_receipt_image: data.receiptImage,
        })
        .select()
        .single();
      
      if (error) throw new Error(`Error creating expense: ${error.message}`);
      
      return {
        ...newExpense,
        glideRowId: newExpense.glide_row_id,
        submittedBy: newExpense.submitted_by,
        expenseReceiptImage: newExpense.expense_receipt_image,
        expenseSupplierName: newExpense.expense_supplier_name,
        createdAt: newExpense.created_at,
        updatedAt: newExpense.updated_at,
      } as Expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
  
  const updateExpense = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExpenseFormData> }): Promise<Expense> => {
      const { data: updatedExpense, error } = await supabase
        .from('gl_expenses')
        .update({
          notes: data.notes,
          amount: data.amount,
          category: data.category,
          date: data.date,
          expense_supplier_name: data.supplierName,
          expense_receipt_image: data.receiptImage,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(`Error updating expense: ${error.message}`);
      
      return {
        ...updatedExpense,
        glideRowId: updatedExpense.glide_row_id,
        submittedBy: updatedExpense.submitted_by,
        expenseReceiptImage: updatedExpense.expense_receipt_image,
        expenseSupplierName: updatedExpense.expense_supplier_name,
        createdAt: updatedExpense.created_at,
        updatedAt: updatedExpense.updated_at,
      } as Expense;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expense', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
  
  const deleteExpense = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('gl_expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(`Error deleting expense: ${error.message}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.removeQueries({ queryKey: ['expense', id] });
    },
  });
  
  return {
    createExpense,
    updateExpense,
    deleteExpense
  };
};
