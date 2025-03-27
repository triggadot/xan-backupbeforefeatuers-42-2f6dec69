
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ScrollAnimation } from '@/components/ui/scroll-animation';

const PurchaseOrders: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Purchase Orders | Glide Sync</title>
      </Helmet>
      <div className="container mx-auto py-6">
        <ScrollAnimation type="fade" className="w-full">
          <h1 className="text-3xl font-bold mb-6">Purchase Orders</h1>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p>Purchase order management will be available soon.</p>
          </div>
        </ScrollAnimation>
      </div>
    </>
  );
};

export default PurchaseOrders;
