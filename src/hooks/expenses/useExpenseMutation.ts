/**
 * Hook for creating, updating, and deleting expenses
 *
 * @module hooks/expenses
 */
import { glExpensesService } from "@/services/supabase/tables/gl-expenses.service";
import { ExpenseFormData, GlExpenseRecord } from "@/types/expenses";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Hook for expense mutation operations
 *
 * @returns Object containing functions for creating, updating, and deleting expenses
 */
export const useExpenseMutation = () => {
  const queryClient = useQueryClient();

  // Create expense mutation
  const createExpense = useMutation({
    mutationFn: async (data: ExpenseFormData): Promise<GlExpenseRecord> => {
      // Create a new glide_row_id for the expense
      const glideRowId = `glexp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

      const newExpense = await glExpensesService.createExpense({
        glide_row_id: glideRowId,
        notes: data.notes,
        amount: data.amount,
        category: data.category,
        date: data.date,
        expense_supplier_name: data.supplier_name,
        expense_receipt_image: data.receipt_image,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return newExpense as GlExpenseRecord;
    },
    onSuccess: () => {
      // Invalidate and refetch expenses list after successful creation
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  // Update expense mutation
  const updateExpense = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ExpenseFormData>;
    }): Promise<GlExpenseRecord> => {
      const updatedExpense = await glExpensesService.updateExpense(id, {
        notes: data.notes,
        amount: data.amount,
        category: data.category,
        date: data.date,
        expense_supplier_name: data.supplier_name,
        expense_receipt_image: data.receipt_image,
        updated_at: new Date().toISOString(),
      });

      return updatedExpense as GlExpenseRecord;
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch the updated expense and expenses list
      queryClient.invalidateQueries({ queryKey: ["expense", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  // Delete expense mutation
  const deleteExpense = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await glExpensesService.deleteExpense(id);
    },
    onSuccess: (_, id) => {
      // Invalidate and refetch the expenses list after successful deletion
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      // Remove specific expense detail from cache
      queryClient.removeQueries({ queryKey: ["expense", id] });
    },
  });

  return {
    createExpense,
    updateExpense,
    deleteExpense,
  };
};

export default useExpenseMutation;
