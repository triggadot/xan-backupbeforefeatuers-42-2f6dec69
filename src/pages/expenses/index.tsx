/**
 * Main expenses page component that lists all expenses
 * Follows the Feature-Based Architecture pattern
 * 
 * @module pages/expenses
 */
import { Helmet } from 'react-helmet-async';
import { ExpenseList } from '@/components/expenses';

/**
 * ExpensesPage component displays a list of all expenses
 */
const ExpensesPage = () => {
  return (
    <>
      <Helmet>
        <title>Expenses | Glidebase</title>
      </Helmet>
      <ExpenseList />
    </>
  );
};

export default ExpensesPage;
