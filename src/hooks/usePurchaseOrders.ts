
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePurchaseOrderDetail } from './purchase-orders/usePurchaseOrderDetail';
import { PurchaseOrder, PurchaseOrderFilters, PurchaseOrderWithVendor } from '@/types/purchaseOrder';
import { usePurchaseOrderMutation } from './purchase-orders/usePurchaseOrderMutation';
import { useFetchPurchaseOrders } from './purchase-orders/useFetchPurchaseOrders';

export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { createPurchaseOrder, updatePurchaseOrder } = usePurchaseOrderMutation();
  const { fetchPurchaseOrders: fetchPOs } = useFetchPurchaseOrders();

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gl_purchase_orders')
        .select('*')
        .order('po_date', { ascending: false });
      
      if (error) throw error;
      
      // Map the data to match our PurchaseOrder interface
      const mappedData = data?.map(po => ({
        id: po.id,
        glide_row_id: po.glide_row_id,
        vendor_uid: po.rowid_accounts,
        po_date: po.po_date,
        purchase_order_uid: po.purchase_order_uid,
        payment_status: po.payment_status,
        total_amount: po.total_amount,
        balance: po.balance,
        created_at: po.created_at,
        updated_at: po.updated_at
      })) || [];
      
      setPurchaseOrders(mappedData);
      return { data: mappedData, error: null };
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load purchase orders',
        variant: 'destructive',
      });
      return { data: [], error };
    } finally {
      setIsLoading(false);
    }
  };

  const getPurchaseOrder = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gl_purchase_orders')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Format the purchase order data
      const purchaseOrder = {
        id: data.id,
        glide_row_id: data.glide_row_id,
        number: data.purchase_order_uid || '',
        vendorId: data.rowid_accounts || '',
        vendorName: 'Vendor', // You would typically fetch this from accounts table
        date: new Date(data.po_date || new Date()),
        status: (data.payment_status || 'draft') as PurchaseOrder['status'],
        total_amount: data.total_amount || 0,
        total_paid: data.total_paid || 0,
        balance: data.balance || 0,
        lineItems: [], // You would typically fetch these separately
        vendorPayments: [], // You would typically fetch these separately
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      return purchaseOrder;
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to load purchase order details',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    purchaseOrders,
    isLoading,
    refreshPurchaseOrders: fetchPurchaseOrders,
    fetchPurchaseOrders,
    getPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder
  };
}
