import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PurchaseOrder } from '@/types/purchase-orders/purchase-sorders';

interface PurchaseOrderFilters {
  search?: string;
  status?: string;
  vendorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Fetch purchase orders with optional filtering
 */
const fetchPurchaseOrders = async (filters?: PurchaseOrderFilters): Promise<PurchaseOrder[]> => {
  let query = supabase
    .from('gl_purchase_orders')
    .select('*');
  
  if (filters?.search) {
    query = query.or(`purchase_order_uid.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.vendorId) {
    query = query.eq('rowid_accounts', filters.vendorId);
  }
  
  if (filters?.dateFrom) {
    query = query.gte('purchase_order_date', filters.dateFrom.toISOString());
  }
  
  if (filters?.dateTo) {
    query = query.lte('purchase_order_date', filters.dateTo.toISOString());
  }
  
  const { data, error } = await query.order('purchase_order_date', { ascending: false });
  
  if (error) {
    throw new Error(`Error fetching purchase orders: ${error.message}`);
  }
  
  return data || [];
};

/**
 * Hook to fetch purchase orders with optional filtering
 */
export const usePurchaseOrders = (options?: { filters?: PurchaseOrderFilters }) => {
  return useQuery<PurchaseOrder[], Error>({
    queryKey: ['purchase-orders', options?.filters],
    queryFn: () => fetchPurchaseOrders(options?.filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
