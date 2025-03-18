
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PurchaseOrder, GlPurchaseOrder, GlVendorPayment, LineItem } from '@/types';
import { mapGlPurchaseOrderToPurchaseOrder } from '@/utils/mapping-utils';

export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPurchaseOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch purchase orders
      const { data: poData, error: poError } = await supabase
        .from('gl_purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (poError) throw poError;
      
      // Early return if no purchase orders
      if (!poData || poData.length === 0) {
        setPurchaseOrders([]);
        return [];
      }
      
      // Get all account IDs to fetch account names
      const accountIds = [...new Set(poData.map(po => po.rowid_accounts))];
      
      // Fetch accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('gl_accounts')
        .select('*')
        .in('glide_row_id', accountIds);
      
      if (accountsError) throw accountsError;
      
      // Create a map of account ID to name
      const accountMap = (accountsData || []).reduce((acc, account) => {
        acc[account.glide_row_id] = account.account_name;
        return acc;
      }, {} as Record<string, string>);
      
      // Fetch all products for these purchase orders (assuming they're linked via gl_products)
      const poIds = poData.map(po => po.glide_row_id);
      const { data: productsData, error: productsError } = await supabase
        .from('gl_products')
        .select('*')
        .in('rowid_purchase_orders', poIds);
      
      if (productsError) throw productsError;
      
      // Fetch all payments for these purchase orders
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('gl_vendor_payments')
        .select('*')
        .in('rowid_purchase_orders', poIds);
        
      if (paymentsError) throw paymentsError;
      
      // Group products and payments by purchase order ID
      const productsByPO = (productsData || []).reduce((acc, product) => {
        const poId = product.rowid_purchase_orders;
        if (poId && !acc[poId]) {
          acc[poId] = [];
        }
        if (poId) {
          acc[poId].push({
            id: product.id,
            rowid_products: product.glide_row_id,
            product_name: product.new_product_name || product.vendor_product_name,
            quantity: product.total_qty_purchased || 1,
            unit_price: product.cost || 0,
            total: (product.total_qty_purchased || 1) * (product.cost || 0)
          });
        }
        return acc;
      }, {} as Record<string, any[]>);
      
      const paymentsByPO = (paymentsData || []).reduce((acc, payment) => {
        if (!acc[payment.rowid_purchase_orders]) {
          acc[payment.rowid_purchase_orders] = [];
        }
        acc[payment.rowid_purchase_orders].push(payment);
        return acc;
      }, {} as Record<string, GlVendorPayment[]>);
      
      // Map database objects to domain objects
      const mappedPOs = poData.map((po: GlPurchaseOrder) => {
        const accountName = accountMap[po.rowid_accounts] || 'Unknown Vendor';
        const lineItems = productsByPO[po.glide_row_id] || [];
        const payments = paymentsByPO[po.glide_row_id] || [];
        
        return mapGlPurchaseOrderToPurchaseOrder(po, accountName, lineItems, payments);
      });
      
      setPurchaseOrders(mappedPOs);
      return mappedPOs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch purchase orders';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getPurchaseOrder = useCallback(async (id: string) => {
    try {
      // Fetch the purchase order
      const { data: po, error: poError } = await supabase
        .from('gl_purchase_orders')
        .select('*')
        .eq('id', id)
        .single();
      
      if (poError) throw poError;
      if (!po) throw new Error('Purchase Order not found');
      
      // Fetch the account
      const { data: account, error: accountError } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('glide_row_id', po.rowid_accounts)
        .single();
      
      if (accountError) throw accountError;
      
      // Fetch products linked to this PO
      const { data: products, error: productsError } = await supabase
        .from('gl_products')
        .select('*')
        .eq('rowid_purchase_orders', po.glide_row_id);
      
      if (productsError) throw productsError;
      
      // Transform products to line items
      const lineItems = (products || []).map(product => ({
        id: product.id,
        rowid_products: product.glide_row_id,
        product_name: product.new_product_name || product.vendor_product_name,
        quantity: product.total_qty_purchased || 1,
        unit_price: product.cost || 0,
        total: (product.total_qty_purchased || 1) * (product.cost || 0)
      }));
      
      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_vendor_payments')
        .select('*')
        .eq('rowid_purchase_orders', po.glide_row_id);
      
      if (paymentsError) throw paymentsError;
      
      // Map to domain object
      return mapGlPurchaseOrderToPurchaseOrder(
        po as GlPurchaseOrder, 
        account?.account_name || 'Unknown Vendor', 
        lineItems, 
        payments as GlVendorPayment[] || []
      );
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

  // Fetch purchase orders for a specific account (vendor)
  const getPurchaseOrdersForAccount = useCallback(async (accountId: string) => {
    try {
      // Get the account's glide_row_id
      const { data: account, error: accountError } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('id', accountId)
        .single();
      
      if (accountError) throw accountError;
      if (!account) throw new Error('Account not found');
      
      // Fetch purchase orders for this account
      const { data: poData, error: poError } = await supabase
        .from('gl_purchase_orders')
        .select('*')
        .eq('rowid_accounts', account.glide_row_id)
        .order('created_at', { ascending: false });
      
      if (poError) throw poError;
      
      // Early return if no purchase orders
      if (!poData || poData.length === 0) {
        return [];
      }
      
      // Get all PO IDs to fetch products and payments
      const poIds = poData.map(po => po.glide_row_id);
      
      // Fetch all products for these purchase orders
      const { data: productsData, error: productsError } = await supabase
        .from('gl_products')
        .select('*')
        .in('rowid_purchase_orders', poIds);
      
      if (productsError) throw productsError;
      
      // Fetch all payments for these purchase orders
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('gl_vendor_payments')
        .select('*')
        .in('rowid_purchase_orders', poIds);
        
      if (paymentsError) throw paymentsError;
      
      // Group products and payments by purchase order ID
      const productsByPO = (productsData || []).reduce((acc, product) => {
        const poId = product.rowid_purchase_orders;
        if (poId && !acc[poId]) {
          acc[poId] = [];
        }
        if (poId) {
          acc[poId].push({
            id: product.id,
            rowid_products: product.glide_row_id,
            product_name: product.new_product_name || product.vendor_product_name,
            quantity: product.total_qty_purchased || 1,
            unit_price: product.cost || 0,
            total: (product.total_qty_purchased || 1) * (product.cost || 0)
          });
        }
        return acc;
      }, {} as Record<string, any[]>);
      
      const paymentsByPO = (paymentsData || []).reduce((acc, payment) => {
        if (!acc[payment.rowid_purchase_orders]) {
          acc[payment.rowid_purchase_orders] = [];
        }
        acc[payment.rowid_purchase_orders].push(payment);
        return acc;
      }, {} as Record<string, GlVendorPayment[]>);
      
      // Map database objects to domain objects
      return poData.map((po: GlPurchaseOrder) => {
        const lineItems = productsByPO[po.glide_row_id] || [];
        const payments = paymentsByPO[po.glide_row_id] || [];
        
        return mapGlPurchaseOrderToPurchaseOrder(po, account.account_name, lineItems, payments);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch purchase orders for account';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  // Fetch purchase orders on component mount
  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  return {
    purchaseOrders,
    isLoading,
    error,
    fetchPurchaseOrders,
    getPurchaseOrder,
    getPurchaseOrdersForAccount
  };
}
