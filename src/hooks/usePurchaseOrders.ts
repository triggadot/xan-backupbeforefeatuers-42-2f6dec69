
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PurchaseOrder, PurchaseOrderFilters, PurchaseOrderWithVendor } from '@/types/purchaseOrder';

export function usePurchaseOrders() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  // Fetch all purchase orders with optional filters
  const fetchPurchaseOrders = async (filters?: PurchaseOrderFilters) => {
    setIsLoading(true);
    setError('');

    try {
      // Use the materialized view for purchase orders with vendor details
      let query = supabase
        .from('mv_purchase_order_vendor_details')
        .select('*');

      // Apply filters if provided
      if (filters) {
        if (filters.vendorId) {
          query = query.eq('vendor_id', filters.vendorId);
        }
        if (filters.status) {
          query = query.eq('payment_status', filters.status);
        }
        if (filters.fromDate) {
          query = query.gte('po_date', filters.fromDate.toISOString());
        }
        if (filters.toDate) {
          query = query.lte('po_date', filters.toDate.toISOString());
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Convert to PurchaseOrderWithVendor type
      const purchaseOrders: PurchaseOrderWithVendor[] = data.map(po => ({
        id: po.glide_row_id, // Use glide_row_id as the id
        number: po.purchase_order_uid || po.glide_row_id,
        date: new Date(po.po_date || po.created_at),
        status: mapPoStatus(po.payment_status),
        vendorId: po.vendor_id,
        vendorName: po.vendor_name,
        total: parseFloat(po.po_total) || 0,
        balance: parseFloat(po.balance) || 0,
        paymentCount: po.payment_count || 0,
        lastPaymentDate: po.last_payment_date ? new Date(po.last_payment_date) : undefined,
        createdAt: new Date(po.created_at),
        updatedAt: new Date(po.updated_at)
      }));

      return { data: purchaseOrders, error: null };
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return { data: [], error: err };
    } finally {
      setIsLoading(false);
    }
  };

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
        return sum + (parseFloat(product.cost) * parseFloat(product.quantity_purchased));
      }, 0);

      const totalPaid = payments.reduce((sum, payment) => {
        return sum + parseFloat(payment.payment_amount);
      }, 0);

      // Map to PurchaseOrder type
      const purchaseOrder: PurchaseOrder = {
        id: po.glide_row_id,
        number: po.purchase_order_uid || po.glide_row_id,
        date: new Date(po.po_date || po.created_at),
        dueDate: po.date_payment_date_mddyyyy ? new Date(po.date_payment_date_mddyyyy) : undefined,
        status: mapPoStatus(po.payment_status),
        vendorId: po.rowid_accounts,
        vendorName: po.vendor?.account_name || 'Unknown Vendor',
        total: subtotal,
        balance: subtotal - totalPaid,
        notes: po.notes || '',
        lineItems: products.map(product => ({
          id: product.id,
          productId: product.id,
          description: product.vendor_product_name || product.new_product_name || '',
          quantity: parseFloat(product.quantity_purchased) || 0,
          unitPrice: parseFloat(product.cost) || 0,
          total: (parseFloat(product.quantity_purchased) || 0) * (parseFloat(product.cost) || 0),
        })),
        payments: payments.map(payment => ({
          id: payment.id,
          date: new Date(payment.date_of_payment || payment.created_at),
          amount: parseFloat(payment.payment_amount) || 0,
          method: payment.type_of_payment || '',
          notes: payment.notes || '',
        })),
        createdAt: new Date(po.created_at),
        updatedAt: new Date(po.updated_at),
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

  // Create a new purchase order
  const createPurchaseOrder = async (data: Partial<PurchaseOrder>) => {
    try {
      const { data: newPo, error } = await supabase
        .from('gl_purchase_orders')
        .insert({
          rowid_accounts: data.vendorId,
          po_date: data.date?.toISOString(),
          purchase_order_uid: data.number,
          notes: data.notes,
          payment_status: data.status || 'draft',
          glide_row_id: `PO-${Date.now()}`
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Purchase Order Created',
        description: 'New purchase order has been created successfully.'
      });

      return newPo;
    } catch (err) {
      console.error('Error creating purchase order:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create purchase order',
        variant: 'destructive',
      });
      throw err;
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
    fetchPurchaseOrders,
    getPurchaseOrder,
    createPurchaseOrder,
    isLoading,
    error
  };
}
