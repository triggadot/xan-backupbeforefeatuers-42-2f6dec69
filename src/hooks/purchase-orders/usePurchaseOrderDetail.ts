
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder, PurchaseOrderLineItem, VendorPayment } from '@/types/purchaseOrder';
import { hasProperty } from '@/types/supabase';

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
      
      // Safely get vendor name with null checks
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
      
      // Get products for this PO
      const { data: products, error: productsError } = await supabase
        .from('gl_products')
        .select('*')
        .eq('rowid_purchase_orders', purchaseOrder.glide_row_id);
        
      if (productsError) throw productsError;
      
      // Get payments for this PO
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_vendor_payments')
        .select('*')
        .eq('rowid_purchase_orders', purchaseOrder.glide_row_id);
        
      if (paymentsError) throw paymentsError;
      
      // Format products
      const lineItems: PurchaseOrderLineItem[] = products.map(product => ({
        id: product.id,
        quantity: Number(product.total_qty_purchased || 0),
        unitPrice: Number(product.cost || 0),
        total: Number(product.total_qty_purchased || 0) * Number(product.cost || 0),
        description: product.display_name || 'Unnamed Product',
        productId: product.glide_row_id || product.id,
        productDetails: product,
        product_name: product.display_name || 'Unnamed Product',
        unit_price: Number(product.cost || 0),
        notes: product.purchase_notes || ''
      }));
      
      // Format payments
      const vendorPayments: VendorPayment[] = payments.map(payment => ({
        id: payment.id,
        amount: Number(payment.payment_amount || 0),
        date: payment.date_of_payment || payment.created_at,
        method: 'Payment',
        notes: payment.vendor_purchase_note || '',
        vendorId: purchaseOrder.rowid_accounts || ''
      }));
      
      // Return the purchase order
      return {
        id: purchaseOrder.glide_row_id,
        number: purchaseOrder.purchase_order_uid || purchaseOrder.glide_row_id,
        date: purchaseOrder.po_date ? new Date(purchaseOrder.po_date) : new Date(purchaseOrder.created_at),
        status: purchaseOrder.payment_status || 'draft',
        vendorId: purchaseOrder.rowid_accounts || '',
        vendorName: vendorName,
        vendor: vendorData,
        lineItems: lineItems,
        vendorPayments: vendorPayments,
        subtotal: Number(purchaseOrder.total_amount || 0),
        tax: 0, // No tax field in the database
        dueDate: purchaseOrder.date_payment_date_mddyyyy ? new Date(purchaseOrder.date_payment_date_mddyyyy) : undefined,
        amountPaid: Number(purchaseOrder.total_paid || 0),
        balance: Number(purchaseOrder.balance || 0),
        total: Number(purchaseOrder.total_amount || 0),
        total_paid: Number(purchaseOrder.total_paid || 0),
        rowid_accounts: purchaseOrder.rowid_accounts || '',
        glide_row_id: purchaseOrder.glide_row_id,
        total_amount: Number(purchaseOrder.total_amount || 0),
        created_at: purchaseOrder.created_at,
        updated_at: purchaseOrder.updated_at,
        notes: purchaseOrder.docs_shortlink || '' // Use docs_shortlink as notes field or empty string
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching purchase order';
      setError(errorMessage);
      console.error('Error fetching purchase order:', err);
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
