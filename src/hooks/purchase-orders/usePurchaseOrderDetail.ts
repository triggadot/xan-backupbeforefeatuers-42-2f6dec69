
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { GlVendorPayment } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface UsePurchaseOrderDetailResult {
  purchaseOrder: PurchaseOrder | null;
  vendor: any | null;
  vendorPayments: GlVendorPayment[] | null;
  isLoading: boolean;
  error: Error | null;
  getPurchaseOrder: (id: string) => Promise<PurchaseOrder | null>;
}

export function usePurchaseOrderDetail(purchaseOrderId?: string): UsePurchaseOrderDetailResult {
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [vendor, setVendor] = useState<any | null>(null);
  const [vendorPayments, setVendorPayments] = useState<GlVendorPayment[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const getPurchaseOrder = async (id: string): Promise<PurchaseOrder | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: purchaseOrderData, error: purchaseOrderError } = await supabase
        .from('gl_purchase_orders')
        .select('*')
        .eq('glide_row_id', id)
        .single();

      if (purchaseOrderError) {
        throw purchaseOrderError;
      }

      if (!purchaseOrderData) {
        setError(new Error('Purchase order not found'));
        return null;
      }

      // Transform the data to match the PurchaseOrder type
      const transformedPO: PurchaseOrder = {
        id: purchaseOrderData.id,
        glide_row_id: purchaseOrderData.glide_row_id,
        number: purchaseOrderData.purchase_order_uid || purchaseOrderData.glide_row_id,
        rowid_accounts: purchaseOrderData.rowid_accounts,
        vendorId: purchaseOrderData.rowid_accounts || '',
        vendorName: 'Unknown Vendor', // We'll get this from the vendor query
        date: purchaseOrderData.po_date ? new Date(purchaseOrderData.po_date) : new Date(purchaseOrderData.created_at),
        status: purchaseOrderData.payment_status as PurchaseOrder['status'],
        total_amount: purchaseOrderData.total_amount || 0,
        total_paid: purchaseOrderData.total_paid || 0,
        total: purchaseOrderData.total_amount || 0,
        balance: purchaseOrderData.balance || 0,
        product_count: purchaseOrderData.product_count || 0,
        created_at: purchaseOrderData.created_at,
        updated_at: purchaseOrderData.updated_at,
        docs_shortlink: purchaseOrderData.docs_shortlink,
        notes: purchaseOrderData.notes,
        lineItems: [],
        vendorPayments: []
      };

      setPurchaseOrder(transformedPO);

      // Fetch vendor details
      try {
        const { data: vendorData, error: vendorError } = await supabase
          .from('gl_accounts')
          .select('*')
          .eq('glide_row_id', purchaseOrderData.rowid_accounts as string)
          .single();
          
        if (vendorError) throw vendorError;
        setVendor(vendorData);
        
        if (transformedPO && vendorData) {
          transformedPO.vendorName = vendorData.account_name || 'Unknown Vendor';
        }
      } catch (error) {
        console.error('Error fetching vendor details:', error);
      }

      // Fetch vendor payments
      try {
        const { data: vendorPaymentsData, error: vendorPaymentsError } = await supabase
          .from('gl_vendor_payments')
          .select('*')
          .eq('rowid_purchase_orders', id);

        if (vendorPaymentsError) {
          throw vendorPaymentsError;
        }

        setVendorPayments(vendorPaymentsData);
        
        if (transformedPO && vendorPaymentsData) {
          // Map vendor payments to the format expected by the PurchaseOrder type
          transformedPO.vendorPayments = vendorPaymentsData.map(payment => ({
            id: payment.id,
            date: payment.date_of_payment ? new Date(payment.date_of_payment) : null,
            amount: payment.payment_amount || 0,
            method: payment.vendor_purchase_note?.split(' ')[0] || 'Unknown',
            notes: payment.vendor_purchase_note || undefined
          }));
        }
      } catch (error) {
        console.error('Error fetching vendor payments:', error);
      }

      return transformedPO;
    } catch (err: any) {
      setError(err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (purchaseOrderId) {
      getPurchaseOrder(purchaseOrderId);
    }
  }, [purchaseOrderId]);

  return { purchaseOrder, vendor, vendorPayments, isLoading, error, getPurchaseOrder };
}
