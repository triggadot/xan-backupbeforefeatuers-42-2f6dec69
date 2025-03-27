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
      let query = supabase
        .from("po_purchase_orders_view")
        .select("*")
        .order("po_number", { ascending: false });

      if (vendorId) {
        query = query.eq("vendor_id", vendorId);
      }

      if (paymentStatus) {
        query = query.eq("payment_status", paymentStatus);
      }

      if (dateFrom) {
        query = query.gte("po_date", dateFrom);
      }

      if (dateTo) {
        query = query.lte("po_date", dateTo);
      }

      const { data, error } = await query;

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
