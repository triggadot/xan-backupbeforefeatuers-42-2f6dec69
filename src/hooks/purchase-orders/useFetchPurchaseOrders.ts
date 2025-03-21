
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrderFilters, PurchaseOrderWithVendor } from '@/types/purchaseOrder';

export function useFetchPurchaseOrders() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all purchase orders with optional filters
  const fetchPurchaseOrders = async (filters?: PurchaseOrderFilters) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build the base query
      let query = supabase
        .from('mv_purchase_order_vendor_details')
        .select('*');
      
      // Apply filters if provided
      if (filters) {
        if (filters.search) {
          query = query.or(`purchase_order_uid.ilike.%${filters.search}%,vendor_name.ilike.%${filters.search}%`);
        }
        
        if (filters.status) {
          query = query.eq('payment_status', filters.status);
        }
        
        if (filters.vendorId) {
          query = query.eq('vendor_id', filters.vendorId);
        }
        
        if (filters.fromDate) {
          query = query.gte('po_date', filters.fromDate.toISOString());
        }
        
        if (filters.toDate) {
          query = query.lte('po_date', filters.toDate.toISOString());
        }
      }
      
      // Execute the query
      const { data, error: fetchError } = await query
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      // Format the data to match PurchaseOrderWithVendor interface
      const formattedData: PurchaseOrderWithVendor[] = data.map(po => ({
        id: po.po_id,
        number: po.purchase_order_uid || po.glide_row_id,
        date: po.po_date ? new Date(po.po_date) : new Date(po.created_at),
        status: po.payment_status as PurchaseOrderWithVendor['status'] || 'draft',
        vendorId: po.vendor_id || '',
        vendorName: po.vendor_name || 'Unknown Vendor',
        total: Number(po.total_amount) || 0,
        balance: Number(po.balance) || 0,
        productCount: Number(po.product_count) || 0,
        totalPaid: Number(po.total_paid) || 0,
        createdAt: new Date(po.created_at),
        updatedAt: new Date(po.updated_at)
      }));
      
      return { data: formattedData, error: null };
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return { data: [], error: err };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchPurchaseOrders,
    isLoading,
    error
  };
}
