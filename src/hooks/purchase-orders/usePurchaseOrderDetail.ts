
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

      // Access gl_purchase_orders table directly instead of using RPC
      const { data, error } = await supabase
        .from('gl_purchase_orders')
        .select(`
          *,
          gl_accounts!gl_purchase_orders_rowid_accounts_fkey(
            id, glide_row_id, account_name
          )
        `)
        .eq('glide_row_id', purchaseOrderId)
        .single();

      if (error) {
        throw error;
      }

      // Transform to match PurchaseOrder type
      const purchaseOrder: PurchaseOrder = {
        id: data.id,
        glideRowId: data.glide_row_id,
        status: data.payment_status,
        poDate: data.po_date,
        totalAmount: data.total_amount,
        totalPaid: data.total_paid,
        balance: data.balance,
        vendorId: data.rowid_accounts,
        vendorName: data.gl_accounts?.account_name || 'Unknown Vendor',
        lineItems: [], // Would need another query to get line items
        vendorPayments: [], // Would need another query to get payments
        pdfLink: data.pdf_link,
        purchaseOrderUid: data.purchase_order_uid,
        notes: data.notes
      };

      return purchaseOrder;
    },
    enabled: !!purchaseOrderId,
  });

  // Define a helper function to get purchase order details
  const getPurchaseOrder = async (id: string): Promise<PurchaseOrder | null> => {
    try {
      // Access gl_purchase_orders table directly
      const { data, error } = await supabase
        .from('gl_purchase_orders')
        .select(`
          *,
          gl_accounts!gl_purchase_orders_rowid_accounts_fkey(
            id, glide_row_id, account_name
          )
        `)
        .eq('glide_row_id', id)
        .single();

      if (error) {
        throw error;
      }

      // Transform to match PurchaseOrder type
      const purchaseOrder: PurchaseOrder = {
        id: data.id,
        glideRowId: data.glide_row_id,
        status: data.payment_status,
        poDate: data.po_date,
        totalAmount: data.total_amount,
        totalPaid: data.total_paid,
        balance: data.balance,
        vendorId: data.rowid_accounts,
        vendorName: data.gl_accounts?.account_name || 'Unknown Vendor',
        lineItems: [], // Would need another query to get line items
        vendorPayments: [], // Would need another query to get payments
        pdfLink: data.pdf_link,
        purchaseOrderUid: data.purchase_order_uid,
        notes: data.notes
      };

      return purchaseOrder;
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
