
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      // Use the correct table name gl_purchase_orders
      const { data, error: fetchError } = await supabase
        .from('gl_purchase_orders')
        .select(`
          *,
          accounts:gl_accounts(account_name)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (data) {
        const mappedPurchaseOrders: PurchaseOrder[] = data.map(po => ({
          id: po.id,
          number: po.purchase_order_uid || `PO-${po.id.slice(0, 8)}`,
          vendorId: po.rowid_accounts || '',
          accountName: po.accounts?.account_name || 'Unknown Vendor',
          date: po.po_date ? new Date(po.po_date) : new Date(),
          dueDate: null, // Handle missing due_date field
          status: (po.payment_status as 'draft' | 'sent' | 'received' | 'partial' | 'complete') || 'draft',
          total: po.total_amount || 0,
          subtotal: po.total_amount || 0, // Assuming subtotal is the same as total for now
          tax: 0, // Default if not provided
          amountPaid: po.total_paid || 0,
          balance: po.balance || 0,
          notes: '', // Handle missing po_notes field
          created_at: po.created_at,
          updated_at: po.updated_at,
          lineItems: [], // Default empty array
          vendorPayments: [], // Default empty array
          // Add Supabase-specific fields for mapping
          glide_row_id: po.glide_row_id,
          rowid_accounts: po.rowid_accounts,
          po_date: po.po_date,
          purchase_order_uid: po.purchase_order_uid
        }));

        setPurchaseOrders(mappedPurchaseOrders);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to get a specific purchase order by ID
  const getPurchaseOrder = useCallback((id: string) => {
    return purchaseOrders.find(po => po.id === id);
  }, [purchaseOrders]);

  // Function to get purchase orders for a specific account
  const getPurchaseOrdersForAccount = useCallback((accountId: string) => {
    return purchaseOrders.filter(po => po.vendorId === accountId);
  }, [purchaseOrders]);

  const addPurchaseOrder = async (newPurchaseOrder: Omit<PurchaseOrder, 'id' | 'created_at'>) => {
    try {
      // Prepare the PO data for Supabase
      const poData = {
        rowid_accounts: newPurchaseOrder.vendorId,
        po_date: newPurchaseOrder.date instanceof Date ? newPurchaseOrder.date.toISOString() : newPurchaseOrder.date,
        payment_status: newPurchaseOrder.status,
        total_amount: newPurchaseOrder.total,
        total_paid: newPurchaseOrder.amountPaid,
        balance: newPurchaseOrder.balance,
        glide_row_id: uuidv4(), // Generate a new glide_row_id
        purchase_order_uid: newPurchaseOrder.number || `PO-${Date.now()}`
      };

      const { data, error: insertError } = await supabase
        .from('gl_purchase_orders')
        .insert(poData)
        .select()
        .single();

      if (insertError) throw insertError;

      // Fix the toast call - use a single object parameter
      toast({
        title: 'Success',
        description: 'Purchase Order created successfully',
      });

      if (data) {
        await fetchPurchaseOrders(); // Refresh the list
      }
    } catch (error) {
      console.error('Error adding purchase order:', error);
      
      // Fix the toast call - use a single object parameter
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create purchase order',
        variant: 'destructive',
      });
      
      throw error;
    }
  };

  const updatePurchaseOrder = async (id: string, updates: Partial<PurchaseOrder>) => {
    try {
      // Prepare the update data for Supabase
      const updateData = {
        rowid_accounts: updates.vendorId,
        po_date: updates.date instanceof Date ? updates.date.toISOString() : updates.date,
        payment_status: updates.status,
        total_amount: updates.total,
        total_paid: updates.amountPaid,
        balance: updates.balance,
        purchase_order_uid: updates.number
      };

      const { error: updateError } = await supabase
        .from('gl_purchase_orders')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      // Fix the toast call - use a single object parameter
      toast({
        title: 'Success',
        description: 'Purchase Order updated successfully',
      });

      await fetchPurchaseOrders(); // Refresh the list
    } catch (error) {
      console.error('Error updating purchase order:', error);
      
      // Fix the toast call - use a single object parameter
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update purchase order',
        variant: 'destructive',
      });
      
      throw error;
    }
  };

  const deletePurchaseOrder = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('gl_purchase_orders')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Fix the toast call - use a single object parameter
      toast({
        title: 'Success',
        description: 'Purchase Order deleted successfully',
      });

      setPurchaseOrders(previous => previous.filter(po => po.id !== id));
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      
      // Fix the toast call - use a single object parameter
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete purchase order',
        variant: 'destructive',
      });
      
      throw error;
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  return {
    purchaseOrders,
    isLoading,
    error,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    fetchPurchaseOrders,
    getPurchaseOrder,
    getPurchaseOrdersForAccount
  };
}
