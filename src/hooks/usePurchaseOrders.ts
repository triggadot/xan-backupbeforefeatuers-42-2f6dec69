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
        .from('gl_purchase_orders')
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
        setPurchaseOrders(data as unknown as PurchaseOrder[]);
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

  // Add getPurchaseOrder function
  const getPurchaseOrder = useCallback(async (id: string): Promise<PurchaseOrder | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('gl_purchase_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        setError(error.message);
        toast({
          title: 'Error',
          description: error.message,
        });
        return null;
      }

      if (data) {
        // Map database fields to domain object
        const mockPO: PurchaseOrder = {
          ...data,
          id: data.id || '',
          number: data.purchase_order_uid || `PO-${data.id}`,
          vendorId: data.rowid_accounts || '',
          accountName: data.vendor_name || data.account_name || 'Unknown Vendor', // Use account_name as fallback
          date: new Date(data.po_date || data.created_at),
          dueDate: data.due_date ? new Date(data.due_date) : (data.payment_date ? new Date(data.payment_date) : null), // Use payment_date as fallback
          status: (data.payment_status || 'draft') as PurchaseOrder['status'],
          total: data.total_amount || 0,
          subtotal: data.total_amount || 0,
          tax: 0,
          amountPaid: data.total_paid || 0,
          balance: data.balance || 0,
          notes: data.po_notes || data.notes || '', // Use notes as fallback
          created_at: data.created_at,
          updated_at: data.updated_at,
          lineItems: [],
          vendorPayments: []
        };
        return mockPO;
      }
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      toast({
        title: 'Error',
        description: message,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Add getPurchaseOrdersForAccount function
  const getPurchaseOrdersForAccount = useCallback(async (accountId: string): Promise<PurchaseOrder[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: account, error: accountError } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('id', accountId)
        .single();
      
      if (accountError) {
        throw accountError;
      }
      
      const { data, error } = await supabase
        .from('gl_purchase_orders')
        .select('*')
        .eq('rowid_accounts', account.glide_row_id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Transform data to PurchaseOrder type - simplified for example
        const orders = data.map((item: any) => ({
          id: item.id,
          number: item.purchase_order_uid || `PO-${item.id}`,
          vendorId: item.rowid_accounts,
          accountName: account.account_name,
          date: new Date(item.po_date || item.created_at),
          status: item.payment_status || 'draft',
          total: item.total_amount || 0,
          subtotal: item.total_amount || 0,
          tax: 0,
          amountPaid: item.total_paid || 0,
          balance: item.balance || 0,
          notes: item.po_notes,
          created_at: item.created_at,
          updated_at: item.updated_at,
          lineItems: [],
          vendorPayments: []
        }));
        return orders;
      }
      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      toast({
        title: 'Error',
        description: message,
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPurchaseOrders();

    const channel = supabase
      .channel('purchase_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gl_purchase_orders' }, (payload) => {
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
      // Map domain object to database fields
      const poData = {
        purchase_order_uid: newPurchaseOrder.number,
        rowid_accounts: newPurchaseOrder.vendorId,
        account_name: newPurchaseOrder.accountName, // Add account_name
        po_date: newPurchaseOrder.date.toISOString(),
        payment_date: newPurchaseOrder.dueDate?.toISOString(), // Use payment_date for dueDate
        payment_status: newPurchaseOrder.status,
        total_amount: newPurchaseOrder.total,
        total_paid: newPurchaseOrder.amountPaid,
        balance: newPurchaseOrder.balance,
        notes: newPurchaseOrder.notes, // Use notes as fallback
        glide_row_id: `po-${Date.now()}`, // Generate a unique glide_row_id
      };

      const { data, error } = await supabase
        .from('gl_purchase_orders')
        .insert(poData)
        .select()
        .single();

      if (error) {
        setError(error.message);
        toast({
          title: 'Error',
          description: error.message,
        });
      } else if (data && data.length > 0) {
        setPurchaseOrders(prevOrders => [data[0] as unknown as PurchaseOrder, ...prevOrders]);
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
        .from('gl_purchase_orders')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) {
        setError(error.message);
        toast({
          title: 'Error',
          description: error.message,
        });
      } else if (data && data.length > 0) {
        setPurchaseOrders(prevOrders =>
          prevOrders.map(order => (order.id === id ? {...order, ...data[0]} as PurchaseOrder : order))
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
        .from('gl_purchase_orders')
        .delete()
        .eq('id', id);

      if (error) {
        setError(error.message);
        toast({
          title: 'Error',
          description: error.message,
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
    getPurchaseOrder,
    getPurchaseOrdersForAccount
  };
};
