
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFetchPurchaseOrders } from './useFetchPurchaseOrders';
import { usePurchaseOrderDetail } from './usePurchaseOrderDetail';
import { usePurchaseOrderMutation } from './usePurchaseOrderMutation';
import { PurchaseOrder, PurchaseOrderFilters } from '@/types/purchase-orders';

/**
 * Standardized hook for purchase order operations
 */
export function useStandardizedPurchaseOrders() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Import functionality from smaller hooks
  const { fetchPurchaseOrders: baseFetchPurchaseOrders } = useFetchPurchaseOrders();
  const { getPurchaseOrder } = usePurchaseOrderDetail(''); // Initialize with empty string
  const { createPurchaseOrder, updatePurchaseOrder } = usePurchaseOrderMutation();

  // Standardized wrapper for fetch operation
  const fetchPurchaseOrders = useCallback(async (filters?: PurchaseOrderFilters) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await baseFetchPurchaseOrders(filters);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching purchase orders';
      setError(errorMessage);
      console.error('Error in useStandardizedPurchaseOrders.fetchPurchaseOrders:', err);
      
      toast({
        title: "Error fetching purchase orders",
        description: errorMessage,
        variant: "destructive"
      });
      
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [baseFetchPurchaseOrders, toast]);

  return {
    fetchPurchaseOrders,
    getPurchaseOrder,
    createOrder: createPurchaseOrder,
    updateOrder: updatePurchaseOrder,
    deleteOrder: async (id: string) => {
      console.log('Delete operation not implemented');
      return false;
    },
    isLoading,
    error
  };
}
