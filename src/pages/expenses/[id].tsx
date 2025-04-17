/**
 * ExpenseDetail page component
 * Displays detailed information about a specific expense
 */
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ExpenseDetail } from '@/components/expenses';

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