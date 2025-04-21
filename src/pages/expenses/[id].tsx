/**
 * Expense detail page component
 * Shows detailed information for a specific expense
 * 
 * @module pages/expenses
 */
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ExpenseDetail } from '@/components/expenses';

/**
 * ExpenseDetailPage component displays detailed information for a specific expense
 */
const ExpenseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return <div>Expense ID is required</div>;
  }
  
  return (
    <>
      <Helmet>
        <title>Expense Details | Glidebase</title>
      </Helmet>
      <ExpenseDetail id={id} />
    </>
  );
};

export default ExpenseDetailPage;
