
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { EntityDetailLayout } from '@/components/common/EntityDetailLayout';
import { PurchaseOrderDetailSkeleton } from './PurchaseOrderDetailSkeleton';
import { NotFoundView } from './NotFoundView';
import { PurchaseOrderHeader } from './PurchaseOrderHeader';
import { PurchaseOrderInfo } from './PurchaseOrderInfo';
import { VendorDetailsCard } from './VendorDetailsCard';
import { ProductsTable } from './ProductsTable';
import { PaymentsTable } from './PaymentsTable';
import { formatCurrency } from '@/utils/format-utils';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function PurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPurchaseOrder, updatePurchaseOrder, isLoading } = usePurchaseOrders();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isLoadingPurchaseOrder, setIsLoadingPurchaseOrder] = useState(true);

  useEffect(() => {
    if (id) {
      loadPurchaseOrder(id);
    }
  }, [id]);

  const loadPurchaseOrder = async (purchaseOrderId: string) => {
    setIsLoadingPurchaseOrder(true);
    try {
      const data = await getPurchaseOrder(purchaseOrderId);
      setPurchaseOrder(data);
    } catch (error) {
      console.error('Error loading purchase order:', error);
    } finally {
      setIsLoadingPurchaseOrder(false);
    }
  };

  const handleRefresh = () => {
    if (id) {
      loadPurchaseOrder(id);
    }
  };

  const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" | "success" | "warning" => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'sent':
        return 'default';
      case 'received':
        return 'default';
      case 'partial':
        return 'warning';
      case 'complete':
        return 'success';
      default:
        return 'default';
    }
  };
  
  const goBackToList = () => {
    navigate('/purchase-orders');
  };

  if (isLoadingPurchaseOrder) {
    return <PurchaseOrderDetailSkeleton />;
  }

  if (!purchaseOrder) {
    return <NotFoundView onBack={goBackToList} />;
  }

  return (
    <EntityDetailLayout
      title={`Purchase Order ${purchaseOrder.number || `#${purchaseOrder.id.substring(0, 8)}`}`}
      status={{
        label: purchaseOrder.status,
        variant: getStatusVariant(purchaseOrder.status)
      }}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-3 w-3 mr-2" />
            Refresh
          </Button>
        </>
      }
      backLink="/purchase-orders"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PurchaseOrderInfo purchaseOrder={purchaseOrder} />
        <VendorDetailsCard purchaseOrder={purchaseOrder} />
      </div>

      <div className="mt-6">
        <ProductsTable purchaseOrder={purchaseOrder} onRefresh={handleRefresh} />
      </div>

      <div className="mt-6">
        <PaymentsTable 
          purchaseOrder={purchaseOrder} 
          onRefresh={handleRefresh}
        />
      </div>
    </EntityDetailLayout>
  );
}
