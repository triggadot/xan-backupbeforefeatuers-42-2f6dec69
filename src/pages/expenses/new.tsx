
/**
 * Create new expense page component
 * Provides a form for creating a new expense
 * 
 * @module pages/expenses
 */
import { Helmet } from 'react-helmet-async';
import { ExpenseForm } from '@/components/expenses';

/**
 * CreateExpensePage component provides a form for creating a new expense
 */
const CreateExpensePage = () => {
  return (
    <>
      <Helmet>
        <title>Create Expense | Glidebase</title>
      </Helmet>
      <ExpenseForm />
    </>
  );
};

export default CreateExpensePage;
