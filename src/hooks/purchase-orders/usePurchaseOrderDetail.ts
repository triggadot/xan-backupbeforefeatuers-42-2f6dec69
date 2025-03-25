
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { hasProperty } from '@/types/supabase';

export function usePurchaseOrderDetail() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPurchaseOrder = async (id: string): Promise<PurchaseOrder | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get purchase order details
      const { data: purchaseOrder, error: poError } = await supabase
        .from('gl_purchase_orders')
        .select(`
          *,
          vendor:rowid_accounts(*)
        `)
        .eq('glide_row_id', id)
        .single();
        
      if (poError) throw poError;
      
      // Get products/line items
      const { data: products, error: productsError } = await supabase
        .from('gl_products')
        .select('*')
        .eq('rowid_purchase_orders', purchaseOrder.glide_row_id);
        
      if (productsError) throw productsError;
      
      // Get vendor payments
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_vendor_payments')
        .select('*')
        .eq('rowid_purchase_orders', purchaseOrder.glide_row_id);
        
      if (paymentsError) throw paymentsError;
      
      // Get vendor name with null checks
      let vendorName = 'Unknown Vendor';
      let vendorData = undefined;
      
      if (purchaseOrder.vendor && 
          typeof purchaseOrder.vendor === 'object' && 
          purchaseOrder.vendor !== null) {
        vendorData = purchaseOrder.vendor;
        
        if (hasProperty(purchaseOrder.vendor, 'account_name')) {
          vendorName = purchaseOrder.vendor.account_name || 'Unknown Vendor';
        }
      }
      
      // Format line items
      const lineItems = products.map(product => ({
        id: product.id,
        quantity: Number(product.total_qty_purchased || 0),
        unitPrice: Number(product.cost || 0),
        total: Number(product.total_qty_purchased || 0) * Number(product.cost || 0),
        description: product.vendor_product_name || product.new_product_name || 'Unknown Product',
        productId: product.glide_row_id,
        productDetails: product,
        product_name: product.vendor_product_name || product.new_product_name || 'Unknown Product',
        unit_price: Number(product.cost || 0),
        notes: product.purchase_notes || '' // Add notes from product
      }));
      
      // Format vendor payments
      const vendorPayments = payments.map(payment => ({
        id: payment.id,
        amount: Number(payment.payment_amount || 0),
        date: payment.date_of_payment ? new Date(payment.date_of_payment) : new Date(payment.created_at),
        method: 'Payment', // Default value as it's not in the database
        notes: payment.vendor_purchase_note || ''
      }));
      
      return {
        id: purchaseOrder.id,
        number: purchaseOrder.purchase_order_uid || purchaseOrder.id.substring(0, 8),
        date: purchaseOrder.po_date ? new Date(purchaseOrder.po_date) : new Date(purchaseOrder.created_at),
        status: purchaseOrder.payment_status || 'draft',
        vendorId: purchaseOrder.rowid_accounts,
        vendorName: vendorName,
        vendor: vendorData,
        lineItems: lineItems,
        vendorPayments: vendorPayments,
        notes: '', // Not stored directly in purchase_orders
        subtotal: Number(purchaseOrder.total_amount || 0),
        tax: 0, // Not stored directly
        total_amount: Number(purchaseOrder.total_amount || 0),
        total_paid: Number(purchaseOrder.total_paid || 0),
        balance: Number(purchaseOrder.balance || 0),
        glide_row_id: purchaseOrder.glide_row_id,
        rowid_accounts: purchaseOrder.rowid_accounts,
        created_at: purchaseOrder.created_at
      };
    } catch (err) {
      console.error('Error fetching purchase order:', err);
      setError(err instanceof Error ? err.message : 'Unknown error fetching purchase order');
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
