
import { useState } from 'react';
import { useFetchPurchaseOrders } from './purchase-orders/useFetchPurchaseOrders';
import { usePurchaseOrderDetail } from './purchase-orders/usePurchaseOrderDetail';
import { usePurchaseOrderMutation } from './purchase-orders/usePurchaseOrderMutation';
import { PurchaseOrderFilters } from '@/types/purchaseOrder';

export function usePurchaseOrders() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Import functionality from smaller hooks
  const { fetchPurchaseOrders: baseFetchPurchaseOrders } = useFetchPurchaseOrders();
  const { getPurchaseOrder } = usePurchaseOrderDetail();
  const { createPurchaseOrder, updatePurchaseOrder } = usePurchaseOrderMutation();

  // Wrapper function that updates loading and error states
  const fetchPurchaseOrders = async (filters?: PurchaseOrderFilters) => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await baseFetchPurchaseOrders(filters);
      if (result.error) {
        throw result.error;
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching purchase orders';
      setError(errorMessage);
      console.error('Error in usePurchaseOrders.fetchPurchaseOrders:', err);
      return { data: [], error: err };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchPurchaseOrders,
    getPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    isLoading,
    error
  };
}
