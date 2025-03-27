
import React from 'react';
import { Helmet } from 'react-helmet-async';
import InvoiceList from '@/components/invoices/list/InvoiceList';
import { ScrollAnimation } from '@/components/ui/scroll-animation';

const Invoices: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Invoices | Glide Sync</title>
      </Helmet>
      <div className="container mx-auto py-6">
        <ScrollAnimation type="fade" className="w-full">
          <h1 className="text-3xl font-bold mb-6">Invoices</h1>
          <InvoiceList />
        </ScrollAnimation>
      </div>
    </>
  );
};

export default Invoices;
