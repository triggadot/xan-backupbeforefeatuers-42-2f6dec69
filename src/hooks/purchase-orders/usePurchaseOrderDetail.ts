
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder, VendorPayment } from '@/types/purchaseOrder';

export function usePurchaseOrderDetail() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get a single purchase order with all related details
  const getPurchaseOrder = async (id: string): Promise<PurchaseOrder | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get PO details
      const { data: po, error: poError } = await supabase
        .from('gl_purchase_orders')
        .select(`
          *,
          vendor:rowid_accounts(*)
        `)
        .eq('id', id)
        .single();
        
      if (poError) throw poError;
      
      // Get related products
      const { data: products, error: productsError } = await supabase
        .from('gl_products')
        .select('*')
        .eq('rowid_purchase_orders', po.glide_row_id);
        
      if (productsError) throw productsError;
      
      // Get vendor payments
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_vendor_payments')
        .select('*')
        .eq('rowid_purchase_orders', po.glide_row_id);
        
      if (paymentsError) throw paymentsError;
      
      // Map products to line items
      const lineItems = products.map(product => ({
        id: product.id,
        rowid_products: product.glide_row_id,
        product_name: product.display_name || product.vendor_product_name || 'Unnamed Product',
        description: product.purchase_notes || '',
        quantity: Number(product.total_qty_purchased) || 0,
        unit_price: Number(product.cost) || 0,
        total: (Number(product.cost) || 0) * (Number(product.total_qty_purchased) || 0),
        productId: product.id,
        productDetails: {
          id: product.id,
          glide_row_id: product.glide_row_id,
          name: product.display_name || product.vendor_product_name || 'Unnamed Product',
          vendor_product_name: product.vendor_product_name,
          new_product_name: product.new_product_name,
          cost: Number(product.cost) || 0,
          total_qty_purchased: Number(product.total_qty_purchased) || 0,
          category: product.category,
          product_image1: product.product_image1,
          purchase_notes: product.purchase_notes,
          created_at: product.created_at,
          updated_at: product.updated_at
        }
      }));
      
      // Map vendor payments
      const vendorPayments: VendorPayment[] = payments.map(payment => ({
        id: payment.id,
        date: payment.date_of_payment ? new Date(payment.date_of_payment) : null,
        amount: Number(payment.payment_amount) || 0,
        method: 'bank transfer', // Default since not in DB schema
        notes: payment.vendor_purchase_note || ''
      }));
      
      // Get vendor name from the joined vendor data
      const vendorName = po.vendor && 
                        typeof po.vendor === 'object' && 
                        po.vendor !== null &&
                        'account_name' in po.vendor ? 
                        po.vendor.account_name : 'Unknown Vendor';
      
      // Create the full PurchaseOrder object
      const formattedPO: PurchaseOrder = {
        id: po.id,
        glide_row_id: po.glide_row_id,
        purchase_order_uid: po.purchase_order_uid,
        number: po.glide_row_id || 'Unknown',
        rowid_accounts: po.rowid_accounts,
        vendorId: po.rowid_accounts,
        vendorName: vendorName,
        po_date: po.po_date,
        date: po.po_date ? new Date(po.po_date) : new Date(po.created_at),
        payment_status: po.payment_status,
        status: po.payment_status as PurchaseOrder['status'] || 'draft',
        total_amount: Number(po.total_amount) || 0,
        total_paid: Number(po.total_paid) || 0,
        total: Number(po.total_amount) || 0,
        balance: Number(po.balance) || 0,
        product_count: Number(po.product_count) || 0,
        created_at: po.created_at,
        updated_at: po.updated_at,
        docs_shortlink: po.docs_shortlink,
        notes: po.notes || '',
        lineItems: lineItems,
        vendorPayments: vendorPayments,
        payments: vendorPayments
      };
      
      return formattedPO;
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
