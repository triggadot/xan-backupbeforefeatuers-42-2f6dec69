
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder } from '@/types/purchase-orders';

export function usePurchaseOrderDetail(purchaseOrderId?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['purchase-order-detail', purchaseOrderId],
    queryFn: async () => {
      if (!purchaseOrderId) {
        throw new Error('Purchase order ID is required');
      }

      // Using a custom RPC function to get purchase order details
      const { data, error } = await supabase
        .rpc('get_purchase_order_by_id', { p_id: purchaseOrderId });

      if (error) {
        throw error;
      }

      return data as PurchaseOrder;
    },
    enabled: !!purchaseOrderId,
  });

  // Define a helper function to get purchase order details
  const getPurchaseOrder = async (id: string): Promise<PurchaseOrder | null> => {
    try {
      const { data, error } = await supabase
        .rpc('get_purchase_order_by_id', { p_id: id });

      if (error) {
        throw error;
      }

      return data as PurchaseOrder;
    } catch (err) {
      console.error('Error fetching purchase order:', err);
      return null;
    }
  };

  return {
    purchaseOrder: data,
    isLoading,
    error,
    getPurchaseOrder // Export the function
  };
}
