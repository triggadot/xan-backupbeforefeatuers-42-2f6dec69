/**
 * ExpenseDetail component displays detailed information about a specific expense
 * 
 * @module components/expenses
 */
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Calendar, Receipt, Tag, Clipboard } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

import { useExpenseDetail } from '@/hooks/expenses/useExpenseDetail';
import { useExpenseMutation } from '@/hooks/expenses/useExpenseMutation';
import { Expense } from '@/types/expenses';

interface ExpenseDetailProps {
  id: string;
}

/**
 * ExpenseDetail component displays detailed information about a specific expense
 */
export const ExpenseDetail = ({ id }: ExpenseDetailProps) => {
  const navigate = useNavigate();
  const { expense, isLoading } = useExpenseDetail(id);
  const { deleteExpense } = useExpenseMutation();

  const handleDelete = async () => {
    try {
      await deleteExpense.mutateAsync(id);
      navigate('/expenses');
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="w-full shadow-md">
          <CardHeader className="flex flex-row items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="w-full shadow-md">
          <CardContent className="py-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Expense Not Found</h2>
              <p className="text-muted-foreground">The expense you're looking for doesn't exist or has been deleted.</p>
              <Button 
                variant="default" 
                className="mt-4"
                onClick={() => navigate('/expenses')}
              >
                Return to Expenses
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="w-full shadow-md">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <div className="flex flex-col">
            <Button 
              variant="ghost" 
              className="flex items-center w-fit -ml-4 mb-2" 
              onClick={() => navigate('/expenses')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Expenses
            </Button>
            <CardTitle className="text-2xl font-bold">
              {expense.category || 'Uncategorized Expense'}
            </CardTitle>
            <p className="text-muted-foreground">
              {expense.date ? format(new Date(expense.date), 'MMMM d, yyyy') : 'No date'}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/expenses/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the expense record.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Notes</h3>
                <div className="bg-muted/50 p-4 rounded-md min-h-[100px]">
                  {expense.notes ? (
                    <p className="whitespace-pre-wrap">{expense.notes}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No notes provided</p>
                  )}
                </div>
              </div>
              
              {expense.expense_supplier_name && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Supplier</h3>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p>{expense.expense_supplier_name}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Amount</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{expense.formattedAmount}</p>
                </CardContent>
              </Card>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{expense.formattedDate || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Tag className="h-5 w-5 text-muted-foreground mr-2" />
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{expense.category || 'Not categorized'}</p>
                  </div>
                </div>
                
                {expense.submitted_by && (
                  <div className="flex items-center">
                    <Clipboard className="h-5 w-5 text-muted-foreground mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Submitted By</p>
                      <p className="font-medium">{expense.submitted_by}</p>
                    </div>
                  </div>
                )}
                
                {expense.expense_receipt_image && (
                  <div className="flex items-center">
                    <Receipt className="h-5 w-5 text-muted-foreground mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Receipt</p>
                      <Button variant="link" className="p-0 h-auto font-medium" onClick={() => window.open(expense.expense_receipt_image, '_blank')}>
                        View Receipt
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <Separator />
        <CardFooter className="py-4 px-6">
          <div className="flex flex-col xs:flex-row justify-between w-full gap-2">
            <div className="text-sm text-muted-foreground">
              Created: {expense.created_at ? format(new Date(expense.created_at), 'MMM d, yyyy h:mm a') : 'Unknown'}
            </div>
            {expense.updated_at && expense.updated_at !== expense.created_at && (
              <div className="text-sm text-muted-foreground">
                Last updated: {format(new Date(expense.updated_at), 'MMM d, yyyy h:mm a')}
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ExpenseDetail;
