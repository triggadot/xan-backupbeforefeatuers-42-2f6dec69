
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder, PurchaseOrderFilters } from '@/types/purchase-orders';

export function usePurchaseOrdersView(filters?: PurchaseOrderFilters) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['purchase-orders', filters],
    queryFn: async () => {
      let query = supabase
        .from('gl_purchase_orders')
        .select('*, gl_accounts!gl_purchase_orders_rowid_accounts_fkey(*)');

      // Apply filters if they exist
      if (filters) {
        if (filters.vendorId) {
          query = query.eq('rowid_accounts', filters.vendorId);
        }
        if (filters.status) {
          query = query.eq('payment_status', filters.status);
        }
        if (filters.dateFrom) {
          query = query.gte('po_date', filters.dateFrom.toISOString());
        }
        if (filters.dateTo) {
          query = query.lte('po_date', filters.dateTo.toISOString());
        }
      }

      // Order by date desc
      query = query.order('po_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Transform data to match PurchaseOrder type
      const purchaseOrders: PurchaseOrder[] = data.map(po => ({
        id: po.id,
        glideRowId: po.glide_row_id,
        status: po.payment_status,
        poDate: po.po_date,
        totalAmount: po.total_amount,
        totalPaid: po.total_paid,
        balance: po.balance,
        vendorId: po.rowid_accounts,
        vendorName: po.gl_accounts?.account_name || 'Unknown Vendor',
        lineItems: [], // Would need to fetch these separately if needed
        vendorPayments: [], // Would need to fetch these separately if needed
        pdfLink: po.pdf_link,
        purchaseOrderUid: po.purchase_order_uid
      }));

      return purchaseOrders;
    },
  });

  // Function to fetch purchase orders with the given filters
  const fetchPurchaseOrders = async (queryFilters?: PurchaseOrderFilters): Promise<PurchaseOrder[]> => {
    try {
      let query = supabase
        .from('gl_purchase_orders')
        .select('*, gl_accounts!gl_purchase_orders_rowid_accounts_fkey(*)');

      // Apply filters if they exist
      if (queryFilters) {
        if (queryFilters.vendorId) {
          query = query.eq('rowid_accounts', queryFilters.vendorId);
        }
        if (queryFilters.status) {
          query = query.eq('payment_status', queryFilters.status);
        }
        if (queryFilters.dateFrom) {
          query = query.gte('po_date', queryFilters.dateFrom.toISOString());
        }
        if (queryFilters.dateTo) {
          query = query.lte('po_date', queryFilters.dateTo.toISOString());
        }
      }

      // Order by date desc
      query = query.order('po_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Transform data to match PurchaseOrder type
      const purchaseOrders: PurchaseOrder[] = data.map(po => ({
        id: po.id,
        glideRowId: po.glide_row_id,
        status: po.payment_status,
        poDate: po.po_date,
        totalAmount: po.total_amount,
        totalPaid: po.total_paid,
        balance: po.balance,
        vendorId: po.rowid_accounts,
        vendorName: po.gl_accounts?.account_name || 'Unknown Vendor',
        lineItems: [], // Would need to fetch these separately if needed
        vendorPayments: [], // Would need to fetch these separately if needed
        pdfLink: po.pdf_link,
        purchaseOrderUid: po.purchase_order_uid
      }));

      return purchaseOrders;
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      return [];
    }
  };

  return {
    purchaseOrders: data || [],
    isLoading,
    error,
    fetchPurchaseOrders
  };
}
