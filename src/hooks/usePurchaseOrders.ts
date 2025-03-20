import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder } from '@/types/purchaseOrder';

export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      // Select from gl_purchase_orders table
      const { data, error: fetchError } = await supabase
        .from('gl_purchase_orders')
        .select(`
          *,
          gl_accounts!gl_purchase_orders_rowid_accounts_fkey (
            account_name
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Convert the database response to PurchaseOrder objects
      const formattedPurchaseOrders: PurchaseOrder[] = data.map(po => ({
        id: po.id,
        number: po.purchase_order_uid || '',
        vendorId: po.rowid_accounts || '',
        accountName: po.gl_accounts?.account_name || '',
        date: new Date(po.po_date || po.created_at),
        dueDate: po.date_payment_date_mddyyyy ? new Date(po.date_payment_date_mddyyyy) : null,
        status: (po.payment_status || 'draft') as PurchaseOrder['status'],
        total: po.total_amount || 0,
        subtotal: po.total_amount || 0, // Assuming no tax breakdown
        tax: 0, // Assuming no tax data available
        amountPaid: po.total_paid || 0,
        balance: po.balance || 0,
        notes: '',
        created_at: po.created_at,
        updated_at: po.updated_at,
        lineItems: [],
        vendorPayments: [],
        glide_row_id: po.glide_row_id,
        rowid_accounts: po.rowid_accounts,
        po_date: po.po_date,
        purchase_order_uid: po.purchase_order_uid
      }));

      setPurchaseOrders(formattedPurchaseOrders);
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError(err instanceof Error ? err.message : 'An error occurred fetching purchase orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPurchaseOrder = useCallback(async (id: string): Promise<PurchaseOrder | null> => {
    try {
      setIsLoading(true);
      
      // First check if we already have it in state
      const existingPO = purchaseOrders.find(po => po.id === id);
      if (existingPO) {
        setIsLoading(false);
        return existingPO;
      }
      
      // Otherwise fetch it from the database
      const { data, error: fetchError } = await supabase
        .from('gl_purchase_orders')
        .select(`
          *,
          gl_accounts!gl_purchase_orders_rowid_accounts_fkey (
            account_name
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!data) return null;

      const purchaseOrder: PurchaseOrder = {
        id: data.id,
        number: data.purchase_order_uid || '',
        vendorId: data.rowid_accounts || '',
        accountName: data.gl_accounts?.account_name || '',
        date: new Date(data.po_date || data.created_at),
        dueDate: data.date_payment_date_mddyyyy ? new Date(data.date_payment_date_mddyyyy) : null,
        status: (data.payment_status || 'draft') as PurchaseOrder['status'],
        total: data.total_amount || 0,
        subtotal: data.total_amount || 0,
        tax: 0,
        amountPaid: data.total_paid || 0,
        balance: data.balance || 0,
        notes: '',
        created_at: data.created_at,
        updated_at: data.updated_at,
        lineItems: [],
        vendorPayments: [],
        glide_row_id: data.glide_row_id,
        rowid_accounts: data.rowid_accounts,
        po_date: data.po_date,
        purchase_order_uid: data.purchase_order_uid
      };
      
      return purchaseOrder;
    } catch (err) {
      console.error('Error fetching purchase order:', err);
      setError(err instanceof Error ? err.message : 'An error occurred fetching the purchase order');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [purchaseOrders]);

  const addPurchaseOrder = useCallback(async (newPurchaseOrder: Omit<PurchaseOrder, 'id' | 'created_at'>) => {
    try {
      setIsLoading(true);
      setError('');

      // Map the PurchaseOrder object to match database schema
      const dbPurchaseOrder = {
        rowid_accounts: newPurchaseOrder.vendorId,
        po_date: newPurchaseOrder.date.toISOString(),
        payment_status: newPurchaseOrder.status,
        total_amount: newPurchaseOrder.total,
        total_paid: newPurchaseOrder.amountPaid,
        balance: newPurchaseOrder.balance,
        glide_row_id: newPurchaseOrder.glide_row_id,
        purchase_order_uid: newPurchaseOrder.number
      };

      const { error: insertError } = await supabase
        .from('gl_purchase_orders')
        .insert(dbPurchaseOrder);

      if (insertError) throw insertError;

      await fetchPurchaseOrders();
    } catch (err) {
      console.error('Error adding purchase order:', err);
      setError(err instanceof Error ? err.message : 'An error occurred adding the purchase order');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPurchaseOrders]);

  const updatePurchaseOrder = useCallback(async (id: string, updates: PurchaseOrder) => {
    try {
      setIsLoading(true);
      setError('');

      // Map the PurchaseOrder updates to match database schema
      const dbUpdates = {
        rowid_accounts: updates.vendorId,
        po_date: updates.date.toISOString(),
        payment_status: updates.status,
        total_amount: updates.total,
        total_paid: updates.amountPaid,
        balance: updates.balance,
        purchase_order_uid: updates.number
      };

      const { error: updateError } = await supabase
        .from('gl_purchase_orders')
        .update(dbUpdates)
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchPurchaseOrders();
    } catch (err) {
      console.error('Error updating purchase order:', err);
      setError(err instanceof Error ? err.message : 'An error occurred updating the purchase order');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPurchaseOrders]);

  const deletePurchaseOrder = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError('');

      const { error: deleteError } = await supabase
        .from('gl_purchase_orders')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchPurchaseOrders();
    } catch (err) {
      console.error('Error deleting purchase order:', err);
      setError(err instanceof Error ? err.message : 'An error occurred deleting the purchase order');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPurchaseOrders]);

  return {
    purchaseOrders,
    isLoading,
    error,
    fetchPurchaseOrders,
    getPurchaseOrder,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    getPurchaseOrdersForAccount: (accountId: string) => {
      return purchaseOrders.filter(po => po.vendorId === accountId);
    }
  };
}
