import { useState } from 'react';
import { useStandardizedPurchaseOrders } from './purchase-orders/useStandardizedPurchaseOrders';
import { usePurchaseOrderDetail } from './usePurchaseOrderDetail';
import { PurchaseOrder } from '@/types/purchase-orders';

export function usePurchaseOrders() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const standardizedHook = useStandardizedPurchaseOrders();
  // Initialize with empty string to avoid the error
  const detailHook = usePurchaseOrderDetail('');
  
  const getPurchaseOrder = async (id: string): Promise<PurchaseOrder | null> => {
    setIsLoading(true);
    try {
      // Use the standardizedHook's getPurchaseOrder method
      const result = await standardizedHook.getPurchaseOrder(id);
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
  };
}
