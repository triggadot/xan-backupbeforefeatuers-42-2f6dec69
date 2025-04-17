
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ExpenseDetail } from '@/components/expenses';
import { ExpenseForm } from '@/components/expenses';

const EditExpensePage = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return <div>Expense ID is required</div>;
  }
  
  return (
    <>
      <Helmet>
        <title>Edit Expense | Glidebase</title>
      </Helmet>
      <ExpenseForm id={id} isEdit={true} />
    </>
  );
};

export default EditExpensePage;
