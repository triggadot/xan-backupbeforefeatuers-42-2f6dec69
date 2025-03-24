import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder, VendorPayment } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface UsePurchaseOrderDetailResult {
  purchaseOrder: PurchaseOrder | null;
  vendor: any | null;
  vendorPayments: VendorPayment[] | null;
  isLoading: boolean;
  error: Error | null;
}

export function usePurchaseOrderDetail(purchaseOrderId: string): UsePurchaseOrderDetailResult {
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [vendor, setVendor] = useState<any | null>(null);
  const [vendorPayments, setVendorPayments] = useState<VendorPayment[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: purchaseOrderData, error: purchaseOrderError } = await supabase
          .from('gl_purchase_orders')
          .select('*')
          .eq('glide_row_id', purchaseOrderId)
          .single();

        if (purchaseOrderError) {
          throw purchaseOrderError;
        }

        if (!purchaseOrderData) {
          setError(new Error('Purchase order not found'));
          return;
        }

        setPurchaseOrder(purchaseOrderData);

        // Fetch vendor details
        try {
          const { data: vendorData, error: vendorError } = await supabase
            .from('gl_accounts')
            .select('*')
            .eq('glide_row_id', purchaseOrderData.rowid_accounts as string)
            .single();
            
          if (vendorError) throw vendorError;
          setVendor(vendorData);
        } catch (error) {
          console.error('Error fetching vendor details:', error);
        }

        // Fetch vendor payments
        try {
          const { data: vendorPaymentsData, error: vendorPaymentsError } = await supabase
            .from('gl_vendor_payments')
            .select('*')
            .eq('rowid_purchase_orders', purchaseOrderId);

          if (vendorPaymentsError) {
            throw vendorPaymentsError;
          }

          setVendorPayments(vendorPaymentsData);
        } catch (error) {
          console.error('Error fetching vendor payments:', error);
        }

      } catch (err: any) {
        setError(err);
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (purchaseOrderId) {
      fetchPurchaseOrder();
    }
  }, [purchaseOrderId, toast]);

  return { purchaseOrder, vendor, vendorPayments, isLoading, error };
}
