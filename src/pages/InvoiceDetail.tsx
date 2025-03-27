
import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { InvoiceDetail as InvoiceDetailComponent } from '@/components/invoices/detail/InvoiceDetail';
import { ScrollAnimation } from '@/components/ui/scroll-animation';

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <>
      <Helmet>
        <title>Invoice Details | Glide Sync</title>
      </Helmet>
      <ScrollAnimation type="fade" className="w-full">
        {id && <InvoiceDetailComponent />}
      </ScrollAnimation>
    </>
  );
};

export default InvoiceDetail;
