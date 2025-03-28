import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder } from '@/types/purchase-orders';

export function usePurchaseOrderDetail(id: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  
  const getPurchaseOrder = useCallback(async (purchaseOrderId: string): Promise<PurchaseOrder | null> => {
    if (!purchaseOrderId) {
      setError('No purchase order ID provided');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('gl_purchase_orders')
        .select(`
          *,
          gl_accounts!gl_purchase_orders_rowid_accounts_fkey(
            id, glide_row_id, account_name
          )
        `)
        .eq('id', purchaseOrderId)
        .single();
      
      if (error) throw error;
      
      // Map the data to match our PurchaseOrder interface
      const mappedPurchaseOrder: PurchaseOrder = {
        id: data.id,
        glideRowId: data.glide_row_id,
        status: data.payment_status,
        poDate: data.po_date,
        date: data.po_date,
        totalAmount: data.total_amount,
        totalPaid: data.total_paid,
        balance: data.balance,
        vendorId: data.rowid_accounts,
        vendorName: data.gl_accounts?.[0]?.account_name || 'Unknown Vendor',
        number: data.purchase_order_uid || '',
        pdfLink: data.pdf_link || '',
        notes: '', // Add a default empty notes field
        lineItems: [], // Add empty line items
        vendorPayments: [], // Add empty vendor payments
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      setPurchaseOrder(mappedPurchaseOrder);
      return mappedPurchaseOrder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching purchase order';
      setError(errorMessage);
      console.error('Error in usePurchaseOrderDetail.getPurchaseOrder:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (id) {
      getPurchaseOrder(id);
    }
  }, [id, getPurchaseOrder]);
  
  return {
    purchaseOrder,
    isLoading,
    error,
    getPurchaseOrder
  };
}
