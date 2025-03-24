
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
  // Additional fields from database
  payment_status?: string;
  po_date?: string | null;
  purchase_order_uid?: string | null;
  docs_shortlink?: string | null;
  balance?: number;
  total_amount?: number;
  total_paid?: number;
  product_count?: number;
  glide_row_id?: string;
  pdf_link?: string | null;
  date_payment_date_mddyyyy?: string | null;
  rowid_accounts?: string | null;
}

interface VendorPayment {
  id: string;
  rowid_purchase_orders: string | null;
  payment_date: string | null;
  payment_amount: number | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string | null;
  // Additional fields from database
  date_of_payment?: string | null;
  glide_row_id?: string;
  updated_at?: string | null;
  rowid_accounts?: string | null;
  date_of_purchase_order?: string | null;
  vendor_purchase_note?: string | null;
  rowid_products?: string | null;
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

      // Map the data to match our PurchaseOrder interface
      const mappedPO: PurchaseOrder = {
        id: data.id,
        vendor_uid: data.rowid_accounts,
        order_date: data.po_date,
        delivery_date: null,
        order_number: data.purchase_order_uid,
        order_total: data.total_amount,
        notes: null,
        status: data.payment_status,
        created_at: data.created_at,
        updated_at: data.updated_at,
        // Additional fields
        payment_status: data.payment_status,
        po_date: data.po_date,
        purchase_order_uid: data.purchase_order_uid,
        docs_shortlink: data.docs_shortlink,
        balance: data.balance,
        total_amount: data.total_amount,
        total_paid: data.total_paid,
        product_count: data.product_count,
        glide_row_id: data.glide_row_id,
        pdf_link: data.pdf_link,
        date_payment_date_mddyyyy: data.date_payment_date_mddyyyy,
        rowid_accounts: data.rowid_accounts
      };

      setPurchaseOrder(mappedPO);
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

      // Map the data to match our VendorPayment interface
      const mappedPayments: VendorPayment[] = (payments || []).map(payment => ({
        id: payment.id,
        rowid_purchase_orders: payment.rowid_purchase_orders,
        payment_date: payment.date_of_payment,
        payment_amount: payment.payment_amount,
        payment_method: null,
        notes: payment.vendor_purchase_note,
        created_at: payment.created_at,
        // Additional fields
        date_of_payment: payment.date_of_payment,
        glide_row_id: payment.glide_row_id,
        updated_at: payment.updated_at,
        rowid_accounts: payment.rowid_accounts,
        date_of_purchase_order: payment.date_of_purchase_order,
        vendor_purchase_note: payment.vendor_purchase_note,
        rowid_products: payment.rowid_products
      }));
      
      setVendorPayments(mappedPayments);
      
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
