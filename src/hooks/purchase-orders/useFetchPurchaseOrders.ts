
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrderFilters, PurchaseOrderWithVendor } from '@/types/purchaseOrder';

export function useFetchPurchaseOrders() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Fetch all purchase orders with optional filters
  const fetchPurchaseOrders = async (filters?: PurchaseOrderFilters) => {
    setIsLoading(true);
    setError('');

    try {
      // Use the materialized view for purchase orders with vendor details
      let query = supabase
        .from('mv_purchase_order_vendor_details')
        .select('*');

      // Apply filters if provided
      if (filters) {
        if (filters.vendorId) {
          query = query.eq('vendor_id', filters.vendorId);
        }
        if (filters.status) {
          query = query.eq('payment_status', filters.status);
        }
        if (filters.fromDate) {
          query = query.gte('po_date', filters.fromDate.toISOString());
        }
        if (filters.toDate) {
          query = query.lte('po_date', filters.toDate.toISOString());
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Convert to PurchaseOrderWithVendor type
      const purchaseOrders: PurchaseOrderWithVendor[] = data.map(po => ({
        id: po.glide_row_id, // Use glide_row_id as the id
        number: po.purchase_order_uid || po.glide_row_id,
        date: new Date(po.po_date || po.created_at),
        status: mapPoStatus(po.payment_status),
        vendorId: po.vendor_id,
        vendorName: po.vendor_name,
        total: parseFloat(po.total_amount) || 0,
        balance: parseFloat(po.balance) || 0,
        paymentCount: po.payment_count || 0,
        lastPaymentDate: po.last_payment_date ? new Date(po.last_payment_date) : undefined,
        createdAt: new Date(po.created_at),
        updatedAt: new Date(po.updated_at)
      }));

      return { data: purchaseOrders, error: null };
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return { data: [], error: err };
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to map status strings
  const mapPoStatus = (status?: string): PurchaseOrderWithVendor['status'] => {
    if (!status) return 'draft';
    
    switch (status.toLowerCase()) {
      case 'paid':
      case 'complete':
        return 'complete';
      case 'partial':
        return 'partial';
      case 'sent':
        return 'sent';
      default:
        return 'draft';
    }
  };

  return {
    fetchPurchaseOrders,
    isLoading,
    error
  };
}
