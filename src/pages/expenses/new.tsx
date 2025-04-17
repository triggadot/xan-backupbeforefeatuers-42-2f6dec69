
import { Helmet } from 'react-helmet-async';
import { ExpenseForm } from '@/components/expenses';

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
