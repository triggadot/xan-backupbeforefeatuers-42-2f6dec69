
import React, { useState } from 'react';
import { useExpenses } from '@/hooks/expenses';
import ExpenseTable from './ExpenseTable';
import ExpenseSummary from './ExpenseSummary';
import ExpenseFormDialog from './ExpenseFormDialog';
import { ExpenseFormData } from '@/types/expenses';
import { useExpenseMutation } from '@/hooks/expenses';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export const ExpenseList: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<ExpenseFormData | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  const {
    expenses,
    isLoading,
    isError,
    error,
    filters,
    updateFilters,
    clearFilters,
    refetch
  } = useExpenses();

  const { createExpense, updateExpense, deleteExpense } = useExpenseMutation();

  const handleCreateExpense = () => {
    setCurrentExpense(null);
    setIsFormOpen(true);
  };

  const handleEditExpense = (expense: any) => {
    // Convert the expense to ExpenseFormData
    setCurrentExpense({
      notes: expense.notes || '',
      amount: expense.amount || 0,
      category: expense.category || '',
      date: expense.date || new Date().toISOString().split('T')[0],
      supplier_name: expense.expense_supplier_name || '',
      receipt_image: expense.expense_receipt_image || ''
    });
    setIsFormOpen(true);
  };

  const handleDeleteExpense = (expense: any) => {
    setExpenseToDelete(expense.id);
  };

  const handleFormSubmit = async (data: ExpenseFormData) => {
    try {
      if (currentExpense) {
        // Update existing expense
        await updateExpense.mutateAsync({
          id: currentExpense.id!,
          data
        });
        toast.success("Expense updated successfully");
      } else {
        // Create new expense
        await createExpense.mutateAsync(data);
        toast.success("Expense created successfully");
      }
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    
    try {
      await deleteExpense.mutateAsync(expenseToDelete);
      toast.success("Expense deleted successfully");
      setExpenseToDelete(null);
      refetch();
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <ExpenseSummary expenses={expenses} isLoading={isLoading} />

      <ExpenseTable
        expenses={expenses}
        isLoading={isLoading}
        error={error}
        filters={filters}
        updateFilters={updateFilters}
        clearFilters={clearFilters}
        onCreateExpense={handleCreateExpense}
        onEditExpense={handleEditExpense}
        onDeleteExpense={handleDeleteExpense}
      />

      {isFormOpen && (
        <ExpenseFormDialog
          expense={currentExpense}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
        />
      )}

      <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the expense record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExpenseList;
