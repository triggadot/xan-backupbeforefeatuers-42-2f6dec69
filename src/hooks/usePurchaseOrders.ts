import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { useToast } from '@/hooks/use-toast';

interface UsePurchaseOrdersProps {
  initialPurchaseOrders?: PurchaseOrder[];
}

export const usePurchaseOrders = ({ initialPurchaseOrders }: UsePurchaseOrdersProps = {}) => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPurchaseOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }

      if (data) {
        setPurchaseOrders(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPurchaseOrders();

    const channel = supabase
      .channel('purchase_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_orders' }, (payload) => {
        fetchPurchaseOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPurchaseOrders, toast]);

  const addPurchaseOrder = async (newPurchaseOrder: Omit<PurchaseOrder, 'id' | 'created_at'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .insert([newPurchaseOrder])
        .select();

      if (error) {
        setError(error.message);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else if (data && data.length > 0) {
        setPurchaseOrders(prevOrders => [data[0], ...prevOrders]);
        toast({
          title: 'Success',
          description: 'Purchase order added successfully',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePurchaseOrder = async (id: string, updates: Partial<PurchaseOrder>) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) {
        setError(error.message);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else if (data && data.length > 0) {
        setPurchaseOrders(prevOrders =>
          prevOrders.map(order => (order.id === id ? data[0] : order))
        );
        toast({
          title: 'Success',
          description: 'Purchase order updated successfully',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deletePurchaseOrder = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', id);

      if (error) {
        setError(error.message);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setPurchaseOrders(prevOrders => prevOrders.filter(order => order.id !== id));
        toast({
          title: 'Success',
          description: 'Purchase order deleted',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    purchaseOrders,
    isLoading,
    error,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    fetchPurchaseOrders,
  };
};
