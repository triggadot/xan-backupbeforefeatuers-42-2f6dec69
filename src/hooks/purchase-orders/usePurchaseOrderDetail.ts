
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder } from '@/types/purchaseOrder';

export function usePurchaseOrderDetail() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPurchaseOrder = async (id: string): Promise<PurchaseOrder | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: poError } = await supabase
        .from('gl_purchase_orders')
        .select(`
          *,
          vendor:rowid_accounts(*)
        `)
        .eq('glide_row_id', id)
        .single();
        
      if (poError) throw poError;
      
      // Get vendor name using optional chaining and nullish coalescing
      const vendorName = data.vendor && 'account_name' in data.vendor 
        ? data.vendor.account_name 
        : 'Unknown Vendor';
      
      const { data: products, error: productsError } = await supabase
        .from('gl_products')
        .select('*')
        .eq('rowid_purchase_orders', data.glide_row_id);
        
      if (productsError) throw productsError;
      
      const { data: vendorPayments, error: vendorPaymentsError } = await supabase
        .from('gl_vendor_payments')
        .select('*')
        .eq('rowid_purchase_orders', data.glide_row_id);
        
      if (vendorPaymentsError) throw vendorPaymentsError;

      return {
        id: data.id,
        glide_row_id: data.glide_row_id,
        number: data.purchase_order_uid || `PO-${data.id.substring(0, 8)}`,
        date: data.po_date ? new Date(data.po_date) : new Date(data.created_at),
        dueDate: data.date_payment_date_mddyyyy ? new Date(data.date_payment_date_mddyyyy) : undefined,
        vendorId: data.rowid_accounts || '',
        vendorName: vendorName,
        status: data.payment_status || 'draft',
        total_amount: Number(data.total_amount || 0),
        total_paid: Number(data.total_paid || 0),
        balance: Number(data.balance || 0),
        amountPaid: Number(data.total_paid || 0),
        notes: data.notes || '',
        created_at: data.created_at,
        updated_at: data.updated_at,
        subtotal: Number(data.total_amount || 0),
        lineItems: products.map(item => ({
          id: item.id,
          productId: item.glide_row_id || '',
          description: item.vendor_product_name || item.new_product_name || 'Unknown',
          product_name: item.vendor_product_name || item.new_product_name || 'Unknown',
          quantity: Number(item.total_qty_purchased || 0),
          unitPrice: Number(item.cost || 0),
          total: Number((item.cost || 0) * (item.total_qty_purchased || 0)),
          productDetails: item
        })),
        vendorPayments: vendorPayments.map(payment => ({
          id: payment.id,
          amount: Number(payment.payment_amount || 0),
          date: payment.date_of_payment || payment.created_at,
          method: 'Payment',
          notes: payment.vendor_purchase_note || ''
        }))
      };
    } catch (err) {
      console.error('Error fetching purchase order:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getPurchaseOrder,
    isLoading,
    error
  };
}
