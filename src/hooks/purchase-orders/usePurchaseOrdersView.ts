
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PurchaseOrder } from "@/types/purchase-orders";

interface UsePurchaseOrdersViewProps {
  vendorId?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function usePurchaseOrdersView({
  vendorId,
  paymentStatus,
  dateFrom,
  dateTo,
}: UsePurchaseOrdersViewProps = {}) {
  const {
    data: purchaseOrders,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "purchase-orders-view",
      vendorId,
      paymentStatus,
      dateFrom,
      dateTo,
    ],
    queryFn: async () => {
      // Using a custom RPC function to avoid table access issues
      const { data, error } = await supabase.rpc('get_purchase_orders', {
        p_vendor_id: vendorId || null,
        p_payment_status: paymentStatus || null,
        p_date_from: dateFrom || null,
        p_date_to: dateTo || null
      });

      if (error) {
        throw error;
      }

      return data as PurchaseOrder[];
    },
  });

  const purchaseOrdersWithFormattedData = purchaseOrders?.map((row) => ({
    ...row,
    vendor: row.vendor_name as string,
    status: row.payment_status as string,
  }));

  return {
    purchaseOrders: purchaseOrdersWithFormattedData,
    isLoading,
    error,
  };
}
