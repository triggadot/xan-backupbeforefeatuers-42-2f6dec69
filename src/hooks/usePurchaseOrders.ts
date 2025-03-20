import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder, PurchaseOrderFilters } from '@/types/purchaseOrder';

export function usePurchaseOrders() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPurchaseOrders = useCallback(async (filters: PurchaseOrderFilters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      // Start with the base query from the materialized view
      let query = supabase
        .from('mv_purchase_order_vendor_details')
        .select('*')
        .order('po_date', { ascending: false });

      // Apply filters
      if (filters.search) {
        query = query.or(`purchase_order_uid.ilike.%${filters.search}%,vendor_name.ilike.%${filters.search}%`);
      }

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.accountId) {
        query = query.eq('vendor_id', filters.accountId);
      }

      if (filters.dateFrom) {
        query = query.gte('po_date', filters.dateFrom.toISOString().split('T')[0]);
      }

      if (filters.dateTo) {
        query = query.lte('po_date', filters.dateTo.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map the data to our PurchaseOrder type
      const purchaseOrders = (data || []).map((po): PurchaseOrder => ({
        id: po.po_id,
        glide_row_id: po.po_glide_id,
        purchase_order_uid: po.purchase_order_uid,
        number: po.po_number || po.purchase_order_uid || `PO-${po.po_id.slice(0, 8)}`,
        accountId: po.vendor_id,
        accountName: po.vendor_name || 'Unknown Vendor',
        date: new Date(po.po_date),
        status: po.status as PurchaseOrder['status'],
        payment_status: po.payment_status,
        total_amount: po.total_amount || 0,
        total_paid: po.total_paid || 0,
        balance: po.balance || 0,
        product_count: po.product_count || 0,
        created_at: po.created_at,
        updated_at: po.updated_at,
        lineItems: [],
        vendorPayments: []
      }));

      return { data: purchaseOrders, error: null };
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return { data: [], error: err };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPurchaseOrder = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Get the PO from the materialized view
      const { data: po, error: poError } = await supabase
        .from('mv_purchase_order_vendor_details')
        .select('*')
        .eq('po_id', id)
        .single();

      if (poError) throw poError;

      if (!po) throw new Error('Purchase order not found');

      // Fetch the vendor details
      const { data: vendorData, error: vendorError } = await supabase
        .from('gl_accounts')
        .select('account_name, accounts_uid')
        .eq('id', po.vendor_id)
        .single();

      // Get products for this PO
      const { data: products, error: productsError } = await supabase
        .from('gl_products')
        .select('*')
        .eq('rowid_purchase_orders', po.po_glide_id);

      if (productsError) throw productsError;

      // Get vendor payments for this PO
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_vendor_payments')
        .select('*')
        .eq('rowid_purchase_orders', po.po_glide_id);

      if (paymentsError) throw paymentsError;

      // Format the purchase order data
      const purchaseOrder: PurchaseOrder = {
        id: po.po_id,
        glide_row_id: po.po_glide_id,
        purchase_order_uid: po.purchase_order_uid,
        number: po.po_number || po.purchase_order_uid || `PO-${po.po_id.slice(0, 8)}`,
        accountId: po.vendor_id,
        accountName: po.vendor_name || (vendorData ? vendorData.account_name : 'Unknown Vendor'),
        date: new Date(po.po_date),
        status: po.status as PurchaseOrder['status'],
        payment_status: po.payment_status,
        total_amount: po.total_amount || 0,
        total_paid: po.total_paid || 0,
        balance: po.balance || 0,
        product_count: po.product_count || 0,
        created_at: po.created_at,
        updated_at: po.updated_at,
        // Format line items from products
        lineItems: (products || []).map(product => ({
          id: product.id,
          rowid_products: product.glide_row_id,
          product_name: product.display_name || product.new_product_name || product.vendor_product_name || 'Unnamed Product',
          quantity: product.total_qty_purchased || 0,
          unit_price: product.cost || 0,
          total: (product.total_qty_purchased || 0) * (product.cost || 0),
          productDetails: {
            id: product.id,
            glide_row_id: product.glide_row_id,
            name: product.display_name || product.new_product_name || product.vendor_product_name || 'Unnamed Product',
            cost: product.cost,
            total_qty_purchased: product.total_qty_purchased,
            category: product.category,
            product_image1: product.product_image1,
            purchase_notes: product.purchase_notes
          }
        })),
        // Format vendor payments
        vendorPayments: (payments || []).map(payment => ({
          id: payment.id,
          date: payment.date_of_payment ? new Date(payment.date_of_payment) : null,
          amount: payment.payment_amount || 0,
          method: payment.type_of_payment,
          notes: payment.payment_note
        }))
      };

      return purchaseOrder;
    } catch (err) {
      console.error('Error fetching purchase order details:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPurchaseOrder = {
    mutateAsync: async (data: any) => {
      setIsLoading(true);
      try {
        const { data: newPO, error } = await supabase
          .from('gl_purchase_orders')
          .insert({
            purchase_order_uid: data.number,
            po_number: data.number,
            rowid_accounts: data.vendorId,
            po_date: data.date instanceof Date ? data.date.toISOString() : data.date,
            status: data.status,
            notes: data.notes
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Success",
          description: "Purchase order created successfully",
        });

        return newPO.id;
      } catch (err) {
        console.error('Error creating purchase order:', err);
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : 'Failed to create purchase order',
          variant: "destructive",
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    }
  };

  const updatePurchaseOrder = {
    mutateAsync: async ({ id, data }: { id: string, data: any }) => {
      setIsLoading(true);
      try {
        const { error } = await supabase
          .from('gl_purchase_orders')
          .update({
            purchase_order_uid: data.number,
            po_number: data.number,
            rowid_accounts: data.vendorId,
            po_date: data.date instanceof Date ? data.date.toISOString() : data.date,
            status: data.status,
            notes: data.notes
          })
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Purchase order updated successfully",
        });

        return true;
      } catch (err) {
        console.error('Error updating purchase order:', err);
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : 'Failed to update purchase order',
          variant: "destructive",
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    }
  };

  const deletePurchaseOrder = {
    mutateAsync: async (id: string) => {
      setIsLoading(true);
      try {
        const { error } = await supabase
          .from('gl_purchase_orders')
          .delete()
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Purchase order deleted successfully",
        });

        return true;
      } catch (err) {
        console.error('Error deleting purchase order:', err);
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : 'Failed to delete purchase order',
          variant: "destructive",
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    }
  };

  return {
    fetchPurchaseOrders,
    getPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    isLoading,
    error
  };
}
