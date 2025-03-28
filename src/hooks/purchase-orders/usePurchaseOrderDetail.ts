
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder } from '@/types/purchase-orders';

export function usePurchaseOrderDetail(initialId?: string) {
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getPurchaseOrder = async (id: string): Promise<PurchaseOrder | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch purchase order with related vendor info
      const { data, error } = await supabase
        .from('gl_purchase_orders')
        .select(`
          *,
          gl_accounts!gl_purchase_orders_rowid_accounts_fkey(
            id, glide_row_id, account_name
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Fetch line items
      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from('gl_products')
        .select('*')
        .eq('rowid_purchase_orders', data.glide_row_id);
      
      if (lineItemsError) console.error('Error fetching line items:', lineItemsError);
      
      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('gl_vendor_payments')
        .select('*')
        .eq('rowid_purchase_orders', data.glide_row_id);
      
      if (paymentsError) console.error('Error fetching payments:', paymentsError);
      
      // Transform to PurchaseOrder format
      const formattedPurchaseOrder: PurchaseOrder = {
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
        lineItems: (lineItemsData || []).map((item: any) => ({
          id: item.id,
          productId: item.id,
          productName: item.vendor_product_name || item.new_product_name || 'Unknown Product',
          quantity: item.total_qty_purchased || 1,
          price: item.cost || 0,
          notes: item.purchase_notes || ''
        })),
        vendorPayments: (paymentsData || []).map((payment: any) => ({
          id: payment.id,
          amount: payment.payment_amount || 0,
          date: payment.date_of_payment,
          paymentDate: payment.date_of_payment,
          notes: payment.vendor_purchase_note || '',
          vendorId: data.rowid_accounts
        })),
        purchaseOrderUid: data.purchase_order_uid,
        pdfLink: data.pdf_link,
        number: data.purchase_order_uid || '',
        dueDate: null,
        notes: '',  // Default to empty string for notes that might not exist
        created_at: data.created_at,
        updated_at: data.updated_at || data.created_at
      };
      
      setPurchaseOrder(formattedPurchaseOrder);
      return formattedPurchaseOrder;
    } catch (err) {
      console.error('Error fetching purchase order:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch purchase order details';
      setError(new Error(errorMessage));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize with provided ID
  if (initialId && !purchaseOrder && !isLoading && !error) {
    getPurchaseOrder(initialId);
  }

  return {
    purchaseOrder,
    isLoading,
    error,
    getPurchaseOrder
  };
}
