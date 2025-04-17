/**
 * Expense Detail Component
 * 
 * Displays detailed information about a specific expense record
 * Allows editing and deleting expenses
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertCircle,
  Calendar, 
  DollarSign, 
  Edit2, 
  FileText, 
  Link as LinkIcon, 
  Trash2, 
  User 
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/ui/use-toast';
import { useExpenseDetail } from '@/hooks/expenses/useExpenseDetail';
import { glExpensesService } from '@/services/supabase';

// UI Components
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

export interface ExpenseDetailProps {
  id: string;
}

export function ExpenseDetail({ id }: ExpenseDetailProps) {
  const { expense, isLoading, isError, refetch } = useExpenseDetail(id);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-6 w-3/4" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-24 mr-2" />
          <Skeleton className="h-10 w-24" />
        </CardFooter>
      </Card>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <Alert variant="destructive" className="w-full max-w-4xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load expense details. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  // No expense found
  if (!expense) {
    return (
      <Alert variant="destructive" className="w-full max-w-4xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>
          The expense you are looking for could not be found.
        </AlertDescription>
      </Alert>
    );
  }
  
  const handleEditClick = () => {
    navigate(`/expenses/${id}/edit`);
  };
  
  const handleDeleteExpense = async () => {
    try {
      setIsDeleting(true);
      await glExpensesService.deleteExpense(id);
      
      toast({
        title: "Expense deleted",
        description: "The expense has been successfully deleted.",
      });
      
      navigate('/expenses');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete",
        description: "There was an error deleting the expense.",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">
              {expense.formattedAmount}
            </CardTitle>
            <CardDescription>
              {expense.formattedDate}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleEditClick}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the expense
                    and remove the data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteExpense}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {expense.category && (
          <div className="flex items-start gap-2">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium">Category</h3>
              <p className="text-sm">{expense.category}</p>
            </div>
          </div>
        )}
        
        {expense.notes && (
          <div className="flex items-start gap-2">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium">Notes</h3>
              <p className="text-sm whitespace-pre-wrap">{expense.notes}</p>
            </div>
          </div>
        )}
        
        {expense.supplier && (
          <div className="flex items-start gap-2">
            <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium">Supplier</h3>
              <p className="text-sm">{expense.supplier}</p>
            </div>
          </div>
        )}
        
        {expense.receipt_url && (
          <div className="flex items-start gap-2">
            <LinkIcon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium">Receipt</h3>
              <a 
                href={expense.receipt_url} 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline"
              >
                View Receipt
              </a>
            </div>
          </div>
        )}
        
        {expense.payment_status && (
          <div className="flex items-start gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium">Payment Status</h3>
              <p className="text-sm capitalize">{expense.payment_status}</p>
            </div>
          </div>
        )}
        
        {expense.payment_date && (
          <div className="flex items-start gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium">Payment Date</h3>
              <p className="text-sm">
                {format(new Date(expense.payment_date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 