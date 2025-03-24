
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePurchaseOrderDetail } from './purchase-orders/usePurchaseOrderDetail';

interface PurchaseOrder {
  id: string;
  vendor_uid: string | null;
  po_date: string | null;
  purchase_order_uid: string | null;
  payment_status: string | null;
  total_amount: number | null;
  balance: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
      setPurchaseOrders(data || []);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load purchase orders',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    purchaseOrders,
    isLoading,
    refreshPurchaseOrders: fetchPurchaseOrders
  };
}
