import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PurchaseOrder {
  id: string;
  vendor_uid: string | number | null;
  order_date: string | null;
  delivery_date: string | null;
  order_number: string | null;
  order_total: number | null;
  notes: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface VendorPayment {
  id: string;
  rowid_purchase_orders: string | null;
  payment_date: string | null;
  payment_amount: number | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string | null;
}

export function usePurchaseOrderDetail(id: string | undefined) {
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [vendorPayments, setVendorPayments] = useState<VendorPayment[]>([]);
  const [vendorUid, setVendorUid] = useState<string | null>(null);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchPurchaseOrder(id);
    }
  }, [id]);

  const fetchPurchaseOrder = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gl_purchase_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setPurchaseOrder(data || null);
      fetchVendorPayments(id);
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to load purchase order details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVendorPayments = async (id: string) => {
    try {
      const { data: payments, error } = await supabase
        .from('gl_vendor_payments')
        .select('*')
        .eq('rowid_purchase_orders', id)
        .order('payment_date', { ascending: false });

      if (error) throw error;

      setVendorPayments(payments || []);
      
      // Calculate paid amount
      if (payments && payments.length > 0) {
        const paidAmount = payments.reduce((sum, payment) => {
          return sum + (payment.payment_amount || 0);
        }, 0);
        setPaidAmount(paidAmount);
      }

      // Get vendor UID from purchase order
      if (purchaseOrder?.vendor_uid) {
        // Ensure vendorUid is always a string
        const vendorUid: string = String(purchaseOrder.vendor_uid);
        setVendorUid(vendorUid);
      }
    } catch (error) {
      console.error('Error fetching vendor payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment details',
        variant: 'destructive',
      });
    }
  };

  return {
    purchaseOrder,
    vendorPayments,
    vendorUid,
    paidAmount,
    isLoading,
  };
}
