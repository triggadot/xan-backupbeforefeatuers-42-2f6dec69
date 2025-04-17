
import { Helmet } from 'react-helmet-async';
import { ExpenseList } from '@/components/expenses';

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
