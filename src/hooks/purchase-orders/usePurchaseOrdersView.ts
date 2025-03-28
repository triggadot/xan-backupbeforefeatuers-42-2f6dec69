
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrderWithVendor } from '@/types/purchase-orders';

export function usePurchaseOrdersView() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['purchase-orders-view'],
    queryFn: async () => {
      try {
        // Use the material view for purchase orders
        const { data, error } = await supabase
          .from('gl_purchase_orders')
          .select(`
            id,
            glide_row_id,
            payment_status,
            po_date,
            total_amount,
            total_paid,
            balance,
            rowid_accounts,
            product_count,
            purchase_order_uid,
            pdf_link,
            gl_accounts!gl_purchase_orders_rowid_accounts_fkey(
              id, glide_row_id, account_name
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Transform to match PurchaseOrderWithVendor
        const purchaseOrders: PurchaseOrderWithVendor[] = data.map(po => ({
          id: po.id,
          glideRowId: po.glide_row_id,
          number: po.purchase_order_uid || '',
          date: po.po_date || null,
          poDate: po.po_date || null,
          status: po.payment_status,
          vendorId: po.rowid_accounts,
          vendorName: po.gl_accounts?.[0]?.account_name || 'Unknown Vendor',
          total: po.total_amount,
          totalAmount: po.total_amount,
          totalPaid: po.total_paid,
          balance: po.balance,
          productCount: po.product_count || 0,
          createdAt: new Date(po.created_at),
          updatedAt: new Date(po.updated_at),
          notes: '', // Add empty notes field as it doesn't exist in database
          lineItems: [], // Add empty line items as required by the type
          vendorPayments: [] // Add empty vendor payments as required by the type
        }));

        return purchaseOrders;
      } catch (error) {
        console.error('Error fetching purchase orders:', error);
        throw error;
      }
    }
  });

  // Function to fetch purchase orders
  const fetchPurchaseOrders = async (): Promise<PurchaseOrderWithVendor[]> => {
    try {
      // Use the material view for purchase orders
      const { data, error } = await supabase
        .from('gl_purchase_orders')
        .select(`
          id,
          glide_row_id,
          payment_status,
          po_date,
          total_amount,
          total_paid,
          balance,
          rowid_accounts,
          product_count,
          purchase_order_uid,
          pdf_link,
          gl_accounts!gl_purchase_orders_rowid_accounts_fkey(
            id, glide_row_id, account_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform to match PurchaseOrderWithVendor
      const purchaseOrders: PurchaseOrderWithVendor[] = data.map(po => ({
        id: po.id,
        glideRowId: po.glide_row_id,
        number: po.purchase_order_uid || '',
        date: po.po_date || null,
        poDate: po.po_date || null,
        status: po.payment_status,
        vendorId: po.rowid_accounts,
        vendorName: po.gl_accounts?.[0]?.account_name || 'Unknown Vendor',
        total: po.total_amount,
        totalAmount: po.total_amount,
        totalPaid: po.total_paid,
        balance: po.balance,
        productCount: po.product_count || 0,
        createdAt: new Date(po.created_at),
        updatedAt: new Date(po.updated_at),
        notes: '', // Add empty notes field as it doesn't exist in database
        lineItems: [], // Add empty line items as required by the type
        vendorPayments: [] // Add empty vendor payments as required by the type
      }));

      return purchaseOrders;
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      return [];
    }
  };

  return {
    purchaseOrders: data || [],
    isLoading,
    error,
    refetch,
    fetchPurchaseOrders
  };
}
