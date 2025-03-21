
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder, PurchaseOrderLineItem, VendorPayment } from '@/types/purchaseOrder';

export function usePurchaseOrderDetail() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Get a single purchase order by ID
  const getPurchaseOrder = async (id: string) => {
    setIsLoading(true);
    setError('');

    try {
      // Get the purchase order with the vendor details
      const { data: po, error: poError } = await supabase
        .from('gl_purchase_orders')
        .select(`
          *,
          vendor:rowid_accounts(*)
        `)
        .eq('glide_row_id', id)
        .single();

      if (poError) throw poError;

      // Get the line items (products associated with this PO)
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

      // Calculate totals
      const subtotal = products.reduce((sum, product) => {
        return sum + (parseFloat(product.cost || '0') * parseFloat(product.total_qty_purchased || '0'));
      }, 0);

      const totalPaid = payments.reduce((sum, payment) => {
        return sum + parseFloat(payment.payment_amount || '0');
      }, 0);

      // Map line items
      const lineItems: PurchaseOrderLineItem[] = products.map(product => ({
        id: product.id,
        rowid_products: product.glide_row_id,
        productId: product.id,
        product_name: product.vendor_product_name || product.new_product_name || '',
        description: product.purchase_notes || '',
        quantity: parseFloat(product.total_qty_purchased || '0'),
        unit_price: parseFloat(product.cost || '0'),
        unitPrice: parseFloat(product.cost || '0'),
        total: parseFloat(product.total_qty_purchased || '0') * parseFloat(product.cost || '0'),
      }));

      // Map payments
      const vendorPayments: VendorPayment[] = payments.map(payment => ({
        id: payment.id,
        date: payment.date_of_payment ? new Date(payment.date_of_payment) : null,
        amount: parseFloat(payment.payment_amount || '0'),
        method: payment.vendor_purchase_note || '',
        notes: payment.vendor_purchase_note || '',
      }));

      // Get vendor name from vendor object or fallback
      const vendorName = po.vendor && typeof po.vendor === 'object' && 
                        'account_name' in po.vendor ? 
                        po.vendor.account_name : 'Unknown Vendor';

      // Map to PurchaseOrder type
      const purchaseOrder: PurchaseOrder = {
        id: po.glide_row_id,
        glide_row_id: po.glide_row_id,
        number: po.purchase_order_uid || po.glide_row_id,
        date: new Date(po.po_date || po.created_at),
        dueDate: po.date_payment_date_mddyyyy ? new Date(po.date_payment_date_mddyyyy) : undefined,
        status: mapPoStatus(po.payment_status),
        vendorId: po.rowid_accounts,
        rowid_accounts: po.rowid_accounts,
        vendorName: vendorName,
        total_amount: subtotal,
        total: subtotal,
        total_paid: totalPaid,
        balance: subtotal - totalPaid,
        notes: po.notes || '',
        lineItems,
        vendorPayments,
        payments: vendorPayments,
        created_at: po.created_at,
        updated_at: po.updated_at,
      };

      return purchaseOrder;
    } catch (err) {
      console.error('Error fetching purchase order:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to map status strings
  const mapPoStatus = (status?: string): PurchaseOrder['status'] => {
    if (!status) return 'draft';
    
    switch (status.toLowerCase()) {
      case 'paid':
      case 'complete':
        return 'complete';
      case 'partial':
        return 'partial';
      case 'sent':
        return 'sent';
      default:
        return 'draft';
    }
  };

  return {
    getPurchaseOrder,
    isLoading,
    error
  };
}
