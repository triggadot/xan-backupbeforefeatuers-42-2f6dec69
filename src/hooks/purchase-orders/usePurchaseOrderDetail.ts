
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
      const { data: purchaseOrder, error: poError } = await supabase
        .from('gl_purchase_orders')
        .select(`
          *,
          vendor:rowid_accounts(*)
        `)
        .eq('glide_row_id', id)
        .single();
        
      if (poError) throw poError;
      
      // Get products linked to this purchase order
      const { data: products, error: productsError } = await supabase
        .from('gl_products')
        .select('*')
        .eq('rowid_purchase_orders', purchaseOrder.glide_row_id);
        
      if (productsError) throw productsError;
      
      // Get payments for this purchase order
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_vendor_payments')
        .select('*')
        .eq('rowid_purchase_orders', purchaseOrder.glide_row_id);
        
      if (paymentsError) throw paymentsError;
      
      // Safely get vendor name with proper null checks
      let vendorName = 'Unknown Vendor';
      if (purchaseOrder.vendor && 
          typeof purchaseOrder.vendor === 'object' && 
          purchaseOrder.vendor !== null &&
          'account_name' in purchaseOrder.vendor) {
        vendorName = purchaseOrder.vendor.account_name || 'Unknown Vendor';
      }
      
      // Format line items (products in this case)
      const lineItems = products.map(product => ({
        id: product.id,
        quantity: Number(product.total_qty_purchased || 0),
        unitPrice: Number(product.cost || 0),
        total: Number(product.total_qty_purchased || 0) * Number(product.cost || 0),
        description: product.vendor_product_name || product.new_product_name || product.display_name || '',
        productId: product.glide_row_id || '',
        productDetails: product
      }));
      
      // Format payments
      const vendorPayments = payments.map(payment => ({
        id: payment.id,
        amount: Number(payment.payment_amount || 0),
        date: payment.date_of_payment ? new Date(payment.date_of_payment) : new Date(payment.created_at),
        method: 'Payment',
        notes: payment.vendor_purchase_note || ''
      }));
      
      // Calculate totals
      const total = Number(purchaseOrder.total_amount || 0);
      const totalPaid = Number(purchaseOrder.total_paid || 0);
      const balance = Number(purchaseOrder.balance || 0);
      
      // Convert notes safely
      const notes = purchaseOrder.docs_shortlink || '';
      
      return {
        id: purchaseOrder.id,
        glide_row_id: purchaseOrder.glide_row_id,
        number: purchaseOrder.purchase_order_uid || purchaseOrder.glide_row_id || '',
        date: purchaseOrder.po_date ? new Date(purchaseOrder.po_date) : new Date(purchaseOrder.created_at),
        status: purchaseOrder.payment_status || 'draft',
        vendorId: purchaseOrder.rowid_accounts || '',
        vendorName: vendorName,
        notes: notes,
        lineItems: lineItems,
        vendorPayments: vendorPayments,
        total: total,
        total_amount: total,
        total_paid: totalPaid,
        balance: balance,
        amountPaid: totalPaid,
        subtotal: total,
        tax: 0,
        created_at: purchaseOrder.created_at,
        updated_at: purchaseOrder.updated_at || null,
        rowid_accounts: purchaseOrder.rowid_accounts
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
