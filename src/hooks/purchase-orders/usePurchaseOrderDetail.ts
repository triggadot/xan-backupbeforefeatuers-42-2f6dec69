
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

      // Then use this type in the select statement
      const selectColumns = [
        "id",
        "created_at",
        "updated_at",
        "po_number",
        "vendor_name",
        "vendor_email",
        "vendor_phone",
        "shipping_address",
        "billing_address",
        "po_date",
        "delivery_date",
        "payment_terms",
        "notes",
        "created_by",
        "updated_by",
        "payment_status",
        "shipping_status",
        "total_amount",
        "discount",
        "shipping_cost",
        "tax_amount"
      ].join(',');

      // Using a raw query to avoid the typing issues
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
