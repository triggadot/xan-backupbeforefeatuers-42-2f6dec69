import { PurchaseOrderList } from '@/components/purchase-orders/PurchaseOrderList';
import { Helmet } from 'react-helmet-async';

export default function PurchaseOrders() {
  return (
    <>
      <Helmet>
        <title>Purchase Orders | Billow Business Console</title>
      </Helmet>
      <div className="py-6">
        <PurchaseOrderList />
      </div>
    </>
  );
} 