
import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PurchaseOrder, PurchaseOrderLineItem, VendorPayment, PurchaseOrderFilters } from '@/types/purchaseOrder';

export function usePurchaseOrders(filters?: PurchaseOrderFilters) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Build query based on filters
  const buildQuery = useCallback(() => {
    let query = supabase
      .from('mv_purchase_order_vendor_details')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.search) {
        query = query.or(`purchase_order_uid.ilike.%${filters.search}%,account_name.ilike.%${filters.search}%`);
      }

      if (filters.status) {
        query = query.eq('payment_status', filters.status);
      }

      if (filters.accountId) {
        query = query.eq('id', filters.accountId);
      }

      if (filters.dateFrom) {
        query = query.gte('po_date', filters.dateFrom.toISOString());
      }

      if (filters.dateTo) {
        query = query.lte('po_date', filters.dateTo.toISOString());
      }
    }

    return query;
  }, [filters]);

  // Fetch purchase orders
  const { 
    data: purchaseOrders = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['purchaseOrders', filters],
    queryFn: async () => {
      const { data, error } = await buildQuery();
      
      if (error) throw error;
      
      return data.map(po => ({
        ...po,
        number: po.purchase_order_uid || `PO-${po.id.slice(0, 8)}`,
        date: new Date(po.po_date || po.created_at),
        status: po.payment_status || 'draft',
        accountName: po.account_name || 'Unknown Vendor',
        accountId: po.rowid_accounts,
        lineItems: [],
        vendorPayments: []
      })) as PurchaseOrder[];
    }
  });

  // Get a single purchase order with details
  const getPurchaseOrder = useCallback(async (id: string) => {
    try {
      // Get PO and account details
      const { data: po, error: poError } = await supabase
        .from('gl_purchase_orders')
        .select('*, gl_accounts!gl_purchase_orders_rowid_accounts_fkey(account_name, accounts_uid)')
        .eq('id', id)
        .single();
      
      if (poError) throw poError;
      
      // Get products for this PO
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
      
      // Transform products to line items
      const lineItems: PurchaseOrderLineItem[] = products.map(product => ({
        id: product.id,
        rowid_products: product.glide_row_id,
        product_name: product.display_name || product.new_product_name || product.vendor_product_name || 'Unnamed Product',
        quantity: product.total_qty_purchased || 1,
        unit_price: product.cost || 0,
        total: (product.total_qty_purchased || 1) * (product.cost || 0),
        productDetails: {
          id: product.id,
          glide_row_id: product.glide_row_id,
          name: product.display_name || product.new_product_name || product.vendor_product_name || 'Unnamed Product',
          display_name: product.display_name,
          vendor_product_name: product.vendor_product_name,
          new_product_name: product.new_product_name,
          cost: product.cost,
          total_qty_purchased: product.total_qty_purchased,
          category: product.category,
          product_image1: product.product_image1,
          purchase_notes: product.purchase_notes,
          created_at: product.created_at,
          updated_at: product.updated_at
        }
      }));
      
      // Transform payments
      const vendorPayments: VendorPayment[] = payments.map(payment => ({
        id: payment.id,
        date: payment.date_of_payment ? new Date(payment.date_of_payment) : null,
        amount: payment.payment_amount || 0,
        method: 'Payment',
        notes: payment.vendor_purchase_note || ''
      }));
      
      return {
        ...po,
        accountName: po.gl_accounts?.account_name || 'Unknown Vendor',
        number: po.purchase_order_uid || `PO-${po.id.slice(0, 8)}`,
        date: new Date(po.po_date || po.created_at),
        status: po.payment_status || 'draft',
        lineItems,
        vendorPayments
      } as PurchaseOrder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch purchase order';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Create a new purchase order
  const createPurchaseOrder = useMutation({
    mutationFn: async (poData: Partial<PurchaseOrder>) => {
      const glideRowId = `PO-${Date.now()}`;
      
      const newPo = {
        glide_row_id: glideRowId,
        rowid_accounts: poData.rowid_accounts,
        po_date: poData.date ? new Date(poData.date).toISOString() : new Date().toISOString(),
        payment_status: 'draft',
        total_amount: 0,
        total_paid: 0,
        balance: 0,
        product_count: 0
      };
      
      const { data, error } = await supabase
        .from('gl_purchase_orders')
        .insert(newPo)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      toast({
        title: 'Success',
        description: 'Purchase order created successfully',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create purchase order';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Update a purchase order
  const updatePurchaseOrder = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<PurchaseOrder> }) => {
      const updateData = {
        ...data,
        po_date: data.date ? new Date(data.date).toISOString() : undefined,
        payment_status: data.status
      };
      
      // Remove properties that don't exist in the table
      delete updateData.date;
      delete updateData.status;
      delete updateData.accountName;
      delete updateData.number;
      delete updateData.lineItems;
      delete updateData.vendorPayments;
      
      const { data: updated, error } = await supabase
        .from('gl_purchase_orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      toast({
        title: 'Success',
        description: 'Purchase order updated successfully',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update purchase order';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Delete a purchase order
  const deletePurchaseOrder = useMutation({
    mutationFn: async (id: string) => {
      // Get the glide_row_id first
      const { data: po } = await supabase
        .from('gl_purchase_orders')
        .select('glide_row_id')
        .eq('id', id)
        .single();
      
      if (!po) throw new Error('Purchase order not found');
      
      // Update any products to remove the PO reference
      await supabase
        .from('gl_products')
        .update({ rowid_purchase_orders: null })
        .eq('rowid_purchase_orders', po.glide_row_id);
      
      // Delete vendor payments
      await supabase
        .from('gl_vendor_payments')
        .delete()
        .eq('rowid_purchase_orders', po.glide_row_id);
      
      // Delete the PO
      const { error } = await supabase
        .from('gl_purchase_orders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      toast({
        title: 'Success',
        description: 'Purchase order deleted successfully',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete purchase order';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Add product to purchase order
  const addProduct = useMutation({
    mutationFn: async ({ 
      purchaseOrderId, 
      productData 
    }: { 
      purchaseOrderId: string, 
      productData: Partial<PurchaseOrderLineItem> 
    }) => {
      // Get PO's glide_row_id first
      const { data: po } = await supabase
        .from('gl_purchase_orders')
        .select('glide_row_id')
        .eq('id', purchaseOrderId)
        .single();
      
      if (!po) throw new Error('Purchase order not found');
      
      const newProduct = {
        glide_row_id: `PROD-${Date.now()}`,
        display_name: productData.product_name,
        rowid_purchase_orders: po.glide_row_id,
        cost: productData.unit_price || 0,
        total_qty_purchased: productData.quantity || 1,
        purchase_notes: productData.productDetails?.purchase_notes
      };
      
      const { data, error } = await supabase
        .from('gl_products')
        .insert(newProduct)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      toast({
        title: 'Success',
        description: 'Product added successfully',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add product';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Update product
  const updateProduct = useMutation({
    mutationFn: async ({ 
      productId, 
      productData 
    }: { 
      productId: string, 
      productData: Partial<PurchaseOrderLineItem> 
    }) => {
      const updateData = {
        display_name: productData.product_name,
        cost: productData.unit_price,
        total_qty_purchased: productData.quantity,
        purchase_notes: productData.productDetails?.purchase_notes
      };
      
      const { data, error } = await supabase
        .from('gl_products')
        .update(updateData)
        .eq('id', productId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Delete product
  const deleteProduct = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('gl_products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      toast({
        title: 'Success',
        description: 'Product removed successfully',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove product';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Add vendor payment
  const addPayment = useMutation({
    mutationFn: async ({ 
      purchaseOrderId, 
      paymentData 
    }: { 
      purchaseOrderId: string, 
      paymentData: Partial<VendorPayment> 
    }) => {
      // Get PO's glide_row_id first
      const { data: po } = await supabase
        .from('gl_purchase_orders')
        .select('glide_row_id, rowid_accounts')
        .eq('id', purchaseOrderId)
        .single();
      
      if (!po) throw new Error('Purchase order not found');
      
      const newPayment = {
        glide_row_id: `VPY-${Date.now()}`,
        rowid_purchase_orders: po.glide_row_id,
        rowid_accounts: po.rowid_accounts,
        payment_amount: paymentData.amount || 0,
        date_of_payment: paymentData.date ? new Date(paymentData.date).toISOString() : new Date().toISOString(),
        vendor_purchase_note: paymentData.notes
      };
      
      const { data, error } = await supabase
        .from('gl_vendor_payments')
        .insert(newPayment)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      toast({
        title: 'Success',
        description: 'Payment added successfully',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add payment';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Update payment
  const updatePayment = useMutation({
    mutationFn: async ({ 
      paymentId, 
      paymentData 
    }: { 
      paymentId: string, 
      paymentData: Partial<VendorPayment> 
    }) => {
      const updateData = {
        payment_amount: paymentData.amount,
        date_of_payment: paymentData.date ? new Date(paymentData.date).toISOString() : undefined,
        vendor_purchase_note: paymentData.notes
      };
      
      const { data, error } = await supabase
        .from('gl_vendor_payments')
        .update(updateData)
        .eq('id', paymentId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      toast({
        title: 'Success',
        description: 'Payment updated successfully',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update payment';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Delete payment
  const deletePayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('gl_vendor_payments')
        .delete()
        .eq('id', paymentId);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      toast({
        title: 'Success',
        description: 'Payment removed successfully',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove payment';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  return {
    purchaseOrders,
    isLoading,
    error,
    fetchPurchaseOrders: refetch,
    getPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    addProduct,
    updateProduct,
    deleteProduct,
    addPayment,
    updatePayment,
    deletePayment
  };
}
