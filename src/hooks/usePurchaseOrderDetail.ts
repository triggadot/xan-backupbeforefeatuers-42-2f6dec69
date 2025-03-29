import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder, PurchaseOrderLineItem } from '@/types/purchaseOrder';
import { GlAccount, GlProduct } from '@/types';

export function usePurchaseOrderDetail(id: string) {
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchPurchaseOrderDetail(id);
    }
  }, [id]);

  const fetchPurchaseOrderDetail = async (purchaseOrderId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch purchase order
      const { data: purchaseOrderData, error: purchaseOrderError } = await supabase
        .from('gl_purchase_orders')
        .select('*')
        .eq('id', purchaseOrderId)
        .single();

      if (purchaseOrderError) throw purchaseOrderError;

      if (!purchaseOrderData) {
        setError('Purchase order not found');
        setIsLoading(false);
        return;
      }

      // Fetch accounts (vendors)
      const { data: accountData, error: accountError } = await supabase
        .from('gl_accounts')
        .select('*');

      if (accountError) throw accountError;

      // Fetch purchase order line items - using gl_po_lines instead of gl_purchase_order_lines
      const { data: lineItemData, error: lineItemError } = await supabase
        .from('gl_po_lines')
        .select('*')
        .eq('rowid_po', purchaseOrderData.glide_row_id);

      if (lineItemError) throw lineItemError;

      // Fetch products
      const productIds: string[] = [];
      if (lineItemData) {
        lineItemData.forEach((lineItem: any) => {
          if (lineItem.rowid_products) {
            productIds.push(lineItem.rowid_products);
          }
        });
      }

      const { data: productData, error: productError } = await supabase
        .from('gl_products')
        .select('*')
        .in('glide_row_id', productIds);

      if (productError) throw productError;

      // Fetch vendor payments
      const { data: paymentData, error: paymentError } = await supabase
        .from('gl_vendor_payments')
        .select('*')
        .eq('rowid_po', purchaseOrderData.glide_row_id);

      if (paymentError) throw paymentError;

      // Create lookup maps for related data
      const accountMap = new Map();
      if (accountData) {
        accountData.forEach((account: GlAccount) => {
          accountMap.set(account.glide_row_id, account);
        });
      }

      const productMap = new Map();
      if (productData) {
        productData.forEach((product: GlProduct) => {
          productMap.set(product.glide_row_id, product);
        });
      }

      // Process line items
      const lineItems: PurchaseOrderLineItem[] = [];
      if (lineItemData) {
        lineItemData.forEach((lineItem: any) => {
          const product = lineItem.rowid_products ? productMap.get(lineItem.rowid_products) : null;
          lineItems.push({
            id: lineItem.id,
            quantity: lineItem.qty || 0,
            unitPrice: lineItem.price || 0,
            total: lineItem.line_total || 0,
            description: lineItem.notes || '',
            productId: lineItem.rowid_products,
            product_name: product?.display_name || 'Unnamed Product',
            unit_price: lineItem.price || 0,
            notes: lineItem.notes || ''
          });
        });
      }

      // Process payments
      const payments = paymentData ? paymentData.map((payment: any) => ({
        id: payment.id,
        amount: payment.payment_amount || 0,
        date: payment.date_of_payment,
        method: payment.payment_method || '',
        notes: payment.notes || ''
      })) : [];

      // Combine data
      const purchaseOrderWithDetails: PurchaseOrder = {
        ...purchaseOrderData,
        id: purchaseOrderData.id,
        glide_row_id: purchaseOrderData.glide_row_id,
        number: purchaseOrderData.po_number,
        date: purchaseOrderData.po_date,
        status: purchaseOrderData.payment_status || 'draft',
        total_amount: purchaseOrderData.total_amount || 0,
        total_paid: purchaseOrderData.total_paid || 0,
        balance: purchaseOrderData.balance || 0,
        notes: purchaseOrderData.notes,
        lineItems,
        vendorPayments: payments,
        created_at: purchaseOrderData.created_at
      };

      // Add vendor information
      if (purchaseOrderData.rowid_accounts) {
        const vendor = accountMap.get(purchaseOrderData.rowid_accounts);
        if (vendor) {
          purchaseOrderWithDetails.vendor = vendor;
          purchaseOrderWithDetails.vendorName = vendor.account_name;
        }
      }

      setPurchaseOrder(purchaseOrderWithDetails);
    } catch (err) {
      console.error('Error fetching purchase order details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching purchase order details');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    purchaseOrder,
    isLoading,
    error,
    fetchPurchaseOrderDetail
  };
}
