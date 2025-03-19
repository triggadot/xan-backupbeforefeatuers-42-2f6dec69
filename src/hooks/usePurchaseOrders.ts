import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PurchaseOrder } from '@/types';

export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchaseOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('gl_purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPurchaseOrders(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch purchase orders';
      setError(errorMessage);
      useToast().toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPurchaseOrder = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('gl_purchase_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as PurchaseOrder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch purchase order';
      setError(errorMessage);
      useToast().toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addPurchaseOrder = useCallback(async (purchaseOrderData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('gl_purchase_orders')
        .insert(purchaseOrderData)
        .select()
        .single();

      if (error) throw error;

      const newPO = data as PurchaseOrder;
      setPurchaseOrders(prev => [...prev, newPO]);

      useToast().toast({
        title: 'Purchase Order Created',
        description: 'Purchase order has been added successfully.',
      });

      // Log the operation
      await supabase.rpc('xdelo_log_message_operation', {
        p_operation: 'po_created',
        p_message_id: newPO.id
      });

      return newPO;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create purchase order';
      setError(errorMessage);
      useToast().toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePurchaseOrder = useCallback(async (id: string, purchaseOrderData: Partial<PurchaseOrder>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('gl_purchase_orders')
        .update(purchaseOrderData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedPO = data as PurchaseOrder;
      setPurchaseOrders(prev =>
        prev.map(po => (po.id === id ? updatedPO : po))
      );

      useToast().toast({
        title: 'Purchase Order Updated',
        description: 'Purchase order has been updated successfully.',
      });

      return updatedPO;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update purchase order';
      setError(errorMessage);
      useToast().toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deletePurchaseOrder = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('gl_purchase_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPurchaseOrders(prev => prev.filter(po => po.id !== id));

      useToast().toast({
        title: 'Purchase Order Deleted',
        description: 'The purchase order has been deleted successfully.',
      });

      // Log the operation
      await supabase.rpc('xdelo_log_message_operation', {
        p_operation: 'po_created',
        p_message_id: id
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete purchase order';
      setError(errorMessage);
      useToast().toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchaseOrders();

    // Setup a realtime subscription for purchase order changes
    const channel = supabase
      .channel('gl-purchase-orders-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gl_purchase_orders'
        },
        () => {
          fetchPurchaseOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
  };
}
