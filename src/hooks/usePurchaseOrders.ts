
import { useState } from 'react';
import { useStandardizedPurchaseOrders } from './purchase-orders/useStandardizedPurchaseOrders';
import { usePurchaseOrderDetail } from './purchase-orders/usePurchaseOrderDetail';
import { PurchaseOrder } from '@/types/purchaseOrder';

export function usePurchaseOrders() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const standardizedHook = useStandardizedPurchaseOrders();
  const detailHook = usePurchaseOrderDetail();
  
  const getPurchaseOrder = async (id: string): Promise<PurchaseOrder | null> => {
    setIsLoading(true);
    try {
      const result = await detailHook.getPurchaseOrder(id);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching purchase order';
      setError(errorMessage);
      console.error('Error in usePurchaseOrders.getPurchaseOrder:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Return all methods from standardizedHook and add in methods we need
  return {
    ...standardizedHook,
    getPurchaseOrder,
    // These are aliases to match the method names used in PurchaseOrderForm
    createPurchaseOrder: standardizedHook.createOrder,
    updatePurchaseOrder: standardizedHook.updateOrder,
    isLoading: isLoading || standardizedHook.isLoading || detailHook.isLoading,
    error: error || standardizedHook.error || detailHook.error
  };
}
