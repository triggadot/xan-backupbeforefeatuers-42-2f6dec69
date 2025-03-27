
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PurchaseOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  return (
    <>
      <Helmet>
        <title>Purchase Order Details | Glide Sync</title>
      </Helmet>
      <div className="container mx-auto py-6">
        <ScrollAnimation type="fade" className="w-full">
          <div className="flex items-center mb-6">
            <Button 
              variant="outline" 
              size="icon" 
              className="mr-4"
              onClick={() => navigate('/purchase-orders')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Purchase Order #{id}</h1>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p>Purchase order details will be available soon.</p>
          </div>
        </ScrollAnimation>
      </div>
    </>
  );
};

export default PurchaseOrderDetail;
