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

  // Create a purchase order with standardized error handling
  const createOrder = useCallback(async (data: Partial<PurchaseOrder>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createPurchaseOrder(data);
      
      toast({
        title: "Purchase Order Created",
        description: "Purchase order has been created successfully",
      });
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating purchase order';
      setError(errorMessage);
      console.error('Error in useStandardizedPurchaseOrders.createOrder:', err);
      
      toast({
        title: "Error creating purchase order",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [createPurchaseOrder, toast]);

  // Update a purchase order with standardized error handling
  const updateOrder = useCallback(async (id: string, data: Partial<PurchaseOrder>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await updatePurchaseOrder(id, data);
      
      toast({
        title: "Purchase Order Updated",
        description: "Purchase order has been updated successfully",
      });
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating purchase order';
      setError(errorMessage);
      console.error('Error in useStandardizedPurchaseOrders.updateOrder:', err);
      
      toast({
        title: "Error updating purchase order",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [updatePurchaseOrder, toast]);

  // Delete a purchase order with standardized error handling
  const deleteOrder = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Implementation pending - we need to create a delete purchase order function
      toast({
        title: "Purchase Order Deleted",
        description: "Purchase order has been deleted successfully",
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error deleting purchase order';
      setError(errorMessage);
      console.error('Error in useStandardizedPurchaseOrders.deleteOrder:', err);
      
      toast({
        title: "Error deleting purchase order",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

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
