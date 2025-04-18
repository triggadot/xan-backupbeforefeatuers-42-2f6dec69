
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExpenseSummary } from './ExpenseSummary';
import { ExpenseTable } from './ExpenseTable';
import { useExpenseQuery } from '@/hooks/expenses/useExpenseQuery';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ExpenseList() {
  const [open, setOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<string | null>(null);
  const { expenses, isLoading, error, createExpense, updateExpense, deleteExpense } = useExpenseQuery();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <Button onClick={() => setOpen(true)} className="hover-lift">
          <Plus className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </div>

      <ExpenseSummary expenses={expenses} isLoading={isLoading} />
      
      <ExpenseTable
        expenses={expenses}
        isLoading={isLoading}
        error={error}
        onEdit={id => setEditingExpense(id)}
        onDelete={id => deleteExpense.mutate(id)}
      />

      <Dialog open={open || !!editingExpense} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
            <DialogDescription>
              Fill in the details for this expense.
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm
            expenseId={editingExpense}
            onSubmit={async (data) => {
              if (editingExpense) {
                await updateExpense.mutateAsync({ id: editingExpense, expense: data });
              } else {
                await createExpense.mutateAsync(data);
              }
              setOpen(false);
              setEditingExpense(null);
            }}
            onCancel={() => {
              setOpen(false);
              setEditingExpense(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
