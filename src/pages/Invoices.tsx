import { InvoiceList } from '@/components/invoices/InvoiceList';
import { Helmet } from 'react-helmet-async';

export default function Invoices() {
  return (
    <>
      <Helmet>
        <title>Invoices | Billow Business Console</title>
      </Helmet>
      <div className="py-6">
        <InvoiceList />
      </div>
    </>
  );
} 