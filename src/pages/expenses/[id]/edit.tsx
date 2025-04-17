
/**
 * Edit expense page component
 * Provides a form for editing an existing expense
 * 
 * @module pages/expenses
 */
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ExpenseForm } from '@/components/expenses';
import { useExpenseDetail } from '@/hooks/expenses';

/**
 * EditExpensePage component provides a form for editing an existing expense
 */
const EditExpensePage = () => {
  const { id } = useParams<{ id: string }>();
  const { expense, isLoading } = useExpenseDetail(id);
  
  if (!id) {
    return <div>Expense ID is required</div>;
  }
  
  return (
    <>
      <Helmet>
        <title>Edit Expense | Glidebase</title>
      </Helmet>
      {isLoading ? (
        <div className="container mx-auto px-4 py-6">
          <div className="w-full h-80 flex items-center justify-center">
            <p className="text-lg text-muted-foreground">Loading expense data...</p>
          </div>
        </div>
      ) : (
        <ExpenseForm expense={expense} isEdit={true} />
      )}
    </>
  );
};

export default EditExpensePage;
