
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder, PurchaseOrderLineItem, VendorPayment } from '@/types/purchaseOrder';
import { 
  PurchaseOrderRow, 
  ProductRow,
  hasProperty, 
  asNumber, 
  asDate, 
  parseJsonIfString,
  asString
} from '@/types/supabase';

export function usePurchaseOrderDetail() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPurchaseOrder = async (id: string): Promise<PurchaseOrder | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Refresh the materialized view
      await supabase.rpc('refresh_materialized_view_secure', {
        view_name: 'mv_purchase_order_vendor_details'
      });
      
      // Fetch from the materialized view
      const { data: purchaseOrder, error: poError } = await supabase
        .from('mv_purchase_order_vendor_details')
        .select('*')
        .eq('glide_row_id', id)
        .single();
        
      if (poError) throw poError;
      
      if (!purchaseOrder) {
        throw new Error(`Purchase order with ID ${id} not found`);
      }

      const po = purchaseOrder as PurchaseOrderRow;
      
      // Safely get vendor data
      let vendorName = 'Unknown Vendor';
      let vendorData = undefined;
      
      if (po.vendor) {
        // If it's a string (JSON), parse it
        const vendorObj = parseJsonIfString<Record<string, unknown>>(po.vendor);
          
        vendorData = vendorObj;
        
        if (vendorObj && hasProperty(vendorObj, 'name')) {
          vendorName = asString(vendorObj.name) || 'Unknown Vendor';
        } else if (vendorObj && hasProperty(vendorObj, 'account_name')) {
          // Fallback to old column name
          vendorName = asString(vendorObj.account_name) || 'Unknown Vendor';
        }
      } else if (po.vendor_name) {
        vendorName = asString(po.vendor_name);
      }
      
      // Get products for this PO - using the new UUID-based foreign key relationship
      const { data: products, error: productsError } = await supabase
        .from('gl_products')
        .select('*')
        .eq('po_id', po.id);
        
      if (productsError) {
        console.error('Error fetching products with po_id:', productsError);
        // Fallback to glide_row_id if UUID foreign key fails
        const { data: fallbackProducts, error: fallbackError } = await supabase
          .from('gl_products')
          .select('*')
          .eq('glide_po_id', po.glide_row_id);
          
        if (fallbackError) throw fallbackError;
        products = fallbackProducts;
      }
      
      // Get payments for this PO
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_vendor_payments')
        .select('*')
        .eq('sb_purchase_orders_id', po.id);
        
      if (paymentsError) {
        console.error('Error fetching payments with sb_purchase_orders_id:', paymentsError);
        // Fallback to rowid_purchase_orders if UUID foreign key fails
        const { data: fallbackPayments, error: fallbackError } = await supabase
          .from('gl_vendor_payments')
          .select('*')
          .eq('rowid_purchase_orders', po.glide_row_id);
          
        if (fallbackError) throw fallbackError;
        payments = fallbackPayments;
      }
      
      // Format products
      const lineItems: PurchaseOrderLineItem[] = products.map((product: ProductRow) => ({
        id: String(product.id || ''),
        quantity: asNumber(product.quantity || product.total_qty_purchased || 0),
        unitPrice: asNumber(product.cost || 0),
        total: asNumber(product.quantity || product.total_qty_purchased || 0) * asNumber(product.cost || 0),
        description: String(product.display_name || product.vendor_name || product.new_product_name || ''),
        productId: String(product.glide_row_id || product.id || ''),
        productDetails: product,
        product_name: String(product.display_name || product.vendor_name || product.new_product_name || ''),
        unit_price: asNumber(product.cost || 0),
        notes: String(product.purchase_notes || '')
      }));
      
      // Format payments
      const vendorPayments: VendorPayment[] = payments.map(payment => ({
        id: String(payment.id || ''),
        amount: asNumber(payment.amount || payment.payment_amount || 0),
        date: asDate(payment.date_of_payment) || asDate(payment.created_at) || new Date(),
        method: 'Payment',
        notes: String(payment.vendor_purchase_note || ''),
        vendorId: String(po.vendor_id || po.sb_accounts_id || po.rowid_accounts || '')
      }));
      
      // Return the purchase order
      return {
        id: String(po.glide_row_id || ''),
        number: String(po.uid || po.purchase_order_uid || po.glide_row_id || ''),
        date: asDate(po.date || po.po_date) || asDate(po.created_at) || new Date(),
        status: String(po.payment_status || 'draft'),
        vendorId: String(po.vendor_id || po.sb_accounts_id || po.rowid_accounts || ''),
        vendorName: vendorName,
        vendor: vendorData,
        lineItems: lineItems,
        vendorPayments: vendorPayments,
        subtotal: asNumber(po.total_amount || 0),
        tax: 0, // No tax field in the database
        dueDate: asDate(po.date_payment_date_mddyyyy),
        amountPaid: asNumber(po.total_paid || 0),
        balance: asNumber(po.balance || 0),
        total: asNumber(po.total_amount || 0),
        total_paid: asNumber(po.total_paid || 0),
        rowid_accounts: String(po.rowid_accounts || po.sb_accounts_id || ''),
        glide_row_id: String(po.glide_row_id || ''),
        total_amount: asNumber(po.total_amount || 0),
        created_at: String(po.created_at || ''),
        updated_at: String(po.updated_at || ''),
        notes: String(po.docs_shortlink || '') // Use docs_shortlink as notes field or empty string
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
