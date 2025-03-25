
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder, PurchaseOrderWithVendor, PurchaseOrderFilters } from '@/types/purchaseOrder';

export function usePurchaseOrdersView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchaseOrders = async (filters?: PurchaseOrderFilters): Promise<PurchaseOrderWithVendor[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('gl_purchase_orders')
        .select(`
          id,
          glide_row_id,
          purchase_order_uid,
          po_date,
          payment_status,
          total_amount,
          total_paid,
          balance,
          product_count,
          rowid_accounts,
          created_at,
          updated_at,
          vendor:rowid_accounts(account_name, id, glide_row_id)
        `);
        
      // Apply filters if provided
      if (filters) {
        if (filters.status) {
          query = query.eq('payment_status', filters.status);
        }
        
        if (filters.vendorId) {
          query = query.eq('rowid_accounts', filters.vendorId);
        }
        
        if (filters.fromDate) {
          query = query.gte('po_date', filters.fromDate.toISOString());
        }
        
        if (filters.toDate) {
          query = query.lte('po_date', filters.toDate.toISOString());
        }
        
        if (filters.search) {
          query = query.or(`purchase_order_uid.ilike.%${filters.search}%,vendor.account_name.ilike.%${filters.search}%`);
        }
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      if (!data) return [];
      
      return data.map(po => {
        let vendorName = 'Unknown Vendor';
        if (po.vendor && typeof po.vendor === 'object') {
          vendorName = po.vendor.account_name || 'Unknown Vendor';
        }
        
        return {
          id: po.id,
          number: po.purchase_order_uid || po.glide_row_id || po.id.substring(0, 8),
          date: po.po_date ? new Date(po.po_date) : new Date(po.created_at),
          status: po.payment_status as any,
          vendorId: po.rowid_accounts,
          vendorName: vendorName,
          total: Number(po.total_amount || 0),
          balance: Number(po.balance || 0),
          totalPaid: Number(po.total_paid || 0),
          productCount: Number(po.product_count || 0),
          createdAt: new Date(po.created_at),
          updatedAt: new Date(po.updated_at || po.created_at)
        };
      });
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
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
        .eq('id', id)
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
      let vendorData = undefined;
      
      if (purchaseOrder.vendor && 
          typeof purchaseOrder.vendor === 'object' && 
          purchaseOrder.vendor !== null) {
        vendorData = purchaseOrder.vendor;
        
        if (vendorData && typeof vendorData === 'object' && 'account_name' in vendorData) {
          vendorName = vendorData.account_name || 'Unknown Vendor';
        }
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
        glide_row_id: purchaseOrder.glide_row_id || '',
        number: purchaseOrder.purchase_order_uid || purchaseOrder.glide_row_id || '',
        date: purchaseOrder.po_date ? new Date(purchaseOrder.po_date) : new Date(purchaseOrder.created_at),
        status: purchaseOrder.payment_status || 'draft',
        vendorId: purchaseOrder.rowid_accounts || '',
        vendorName: vendorName,
        vendor: vendorData,
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
        rowid_accounts: purchaseOrder.rowid_accounts || ''
      };
    } catch (err) {
      console.error('Error fetching purchase order:', err);
      setError(err instanceof Error ? err.message : 'Unknown error fetching purchase order');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const addProduct = useMutation({
    mutationFn: async ({ purchaseOrderGlideId, data }: { purchaseOrderGlideId: string, data: any }) => {
      const { data: result, error } = await supabase
        .from('gl_products')
        .insert({
          rowid_purchase_orders: purchaseOrderGlideId,
          vendor_product_name: data.description,
          total_qty_purchased: data.quantity,
          cost: data.unitPrice,
          purchase_notes: data.notes,
          glide_row_id: crypto.randomUUID()
        })
        .select()
        .single();
        
      if (error) throw error;
      return result;
    }
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const { data: result, error } = await supabase
        .from('gl_products')
        .update({
          vendor_product_name: data.description,
          total_qty_purchased: data.quantity,
          cost: data.unitPrice,
          purchase_notes: data.notes,
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return result;
    }
  });

  const deleteProduct = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('gl_products')
        .delete()
        .eq('id', productId);
        
      if (error) throw error;
      return true;
    }
  });

  const addPayment = useMutation({
    mutationFn: async ({ purchaseOrderGlideId, data }: { purchaseOrderGlideId: string, data: any }) => {
      const { data: result, error } = await supabase
        .from('gl_vendor_payments')
        .insert({
          rowid_purchase_orders: purchaseOrderGlideId,
          rowid_accounts: data.vendorId,
          payment_amount: data.amount,
          date_of_payment: data.paymentDate ? new Date(data.paymentDate).toISOString() : new Date().toISOString(),
          vendor_purchase_note: data.notes,
          glide_row_id: crypto.randomUUID()
        })
        .select()
        .single();
        
      if (error) throw error;
      return result;
    }
  });

  const updatePayment = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const { data: result, error } = await supabase
        .from('gl_vendor_payments')
        .update({
          payment_amount: data.amount,
          date_of_payment: data.paymentDate ? new Date(data.paymentDate).toISOString() : undefined,
          vendor_purchase_note: data.notes,
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return result;
    }
  });

  const deletePayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('gl_vendor_payments')
        .delete()
        .eq('id', paymentId);
        
      if (error) throw error;
      return true;
    }
  });

  return {
    fetchPurchaseOrders,
    getPurchaseOrder,
    addProduct,
    updateProduct,
    deleteProduct,
    addPayment,
    updatePayment,
    deletePayment,
    isLoading,
    error
  };
}
