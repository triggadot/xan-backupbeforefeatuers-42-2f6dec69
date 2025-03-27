import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder } from '@/types/purchase-orders';

// Create a simpler type for the column specification
type ColumnSpec = Record<string, { name: string; type: string }>;

export function usePurchaseOrderDetail(purchaseOrderId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['purchase-order-detail', purchaseOrderId],
    queryFn: async () => {
      if (!purchaseOrderId) {
        throw new Error('Purchase order ID is required');
      }

      // Then use this type in the select statement
      const selectColumns: ColumnSpec = {
        id: { name: "id", type: "uuid" },
        created_at: { name: "created_at", type: "timestamp" },
        updated_at: { name: "updated_at", type: "timestamp" },
        po_number: { name: "po_number", type: "text" },
        vendor_name: { name: "vendor_name", type: "text" },
        vendor_email: { name: "vendor_email", type: "text" },
        vendor_phone: { name: "vendor_phone", type: "text" },
        shipping_address: { name: "shipping_address", type: "text" },
        billing_address: { name: "billing_address", type: "text" },
        po_date: { name: "po_date", type: "date" },
        delivery_date: { name: "delivery_date", type: "date" },
        payment_terms: { name: "payment_terms", type: "text" },
        notes: { name: "notes", type: "text" },
        created_by: { name: "created_by", type: "uuid" },
        updated_by: { name: "updated_by", type: "uuid" },
        payment_status: { name: "payment_status", type: "text" },
        shipping_status: { name: "shipping_status", type: "text" },
        total_amount: { name: "total_amount", type: "numeric" },
        discount: { name: "discount", type: "numeric" },
        shipping_cost: { name: "shipping_cost", type: "numeric" },
        tax_amount: { name: "tax_amount", type: "numeric" },
      };

      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          created_at,
          updated_at,
          po_number,
          vendor_name,
          vendor_email,
          vendor_phone,
          shipping_address,
          billing_address,
          po_date,
          delivery_date,
          payment_terms,
          notes,
          created_by,
          updated_by,
          payment_status,
          shipping_status,
          total_amount,
          discount,
          shipping_cost,
          tax_amount
        `)
        .eq('id', purchaseOrderId)
        .single();

      if (error) {
        throw error;
      }

      return data as PurchaseOrder;
    },
  });

  return {
    purchaseOrder: data,
    isLoading,
    error,
  };
}
