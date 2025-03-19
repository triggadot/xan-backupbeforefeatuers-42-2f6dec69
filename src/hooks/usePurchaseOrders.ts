
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PurchaseOrder, GlPurchaseOrder, GlVendorPayment, LineItem, ProductDetails } from '@/types';
import { mapGlPurchaseOrderToPurchaseOrder } from '@/utils/mapping-utils';

// Fetch product details (reusing the same function as in other services)
async function fetchProductDetails(productGlideId: string | null | undefined): Promise<ProductDetails | null> {
  if (!productGlideId) return null;
  
  const { data, error } = await supabase
    .from('gl_products')
    .select('*')
    .eq('glide_row_id', productGlideId)
    .maybeSingle();
    
  if (error) {
    console.error('Error fetching product details:', error);
    return null;
  }
  
  if (!data) return null;
  
  return {
    id: data.id,
    glide_row_id: data.glide_row_id,
    name: data.display_name || data.new_product_name || data.vendor_product_name || 'Unnamed Product',
    display_name: data.display_name,
    vendor_product_name: data.vendor_product_name,
    new_product_name: data.new_product_name,
    cost: data.cost,
    total_qty_purchased: data.total_qty_purchased,
    category: data.category,
    product_image1: data.product_image1,
    purchase_notes: data.purchase_notes,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

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
          // Include the product itself as productDetails
          const productDetails: ProductDetails = {
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
          };
          
          acc[poId].push({
            id: product.id,
            rowid_products: product.glide_row_id,
            product_name: product.new_product_name || product.vendor_product_name,
            quantity: product.total_qty_purchased || 1,
            unit_price: product.cost || 0,
            total: (product.total_qty_purchased || 1) * (product.cost || 0),
            productDetails: productDetails
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
        
        const result = mapGlPurchaseOrderToPurchaseOrder(po, accountName, lineItems, payments);
        
        // Add vendor payments to the result for UI purposes
        return {
          ...result,
          vendorPayments: payments.map(payment => ({
            id: payment.id,
            date: payment.date_of_payment ? new Date(payment.date_of_payment) : null,
            amount: Number(payment.payment_amount) || 0,
            method: 'Payment',
            notes: payment.vendor_purchase_note || ''
          }))
        };
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
      
      // Transform products to line items with productDetails
      const lineItems = (products || []).map(product => {
        // Include the product itself as productDetails
        const productDetails: ProductDetails = {
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
        };
        
        return {
          id: product.id,
          rowid_products: product.glide_row_id,
          product_name: product.new_product_name || product.vendor_product_name,
          quantity: product.total_qty_purchased || 1,
          unit_price: product.cost || 0,
          total: (product.total_qty_purchased || 1) * (product.cost || 0),
          productDetails: productDetails
        };
      });
      
      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_vendor_payments')
        .select('*')
        .eq('rowid_purchase_orders', po.glide_row_id);
      
      if (paymentsError) throw paymentsError;
      
      // Map to domain object
      const purchaseOrder = mapGlPurchaseOrderToPurchaseOrder(
        po as GlPurchaseOrder, 
        account?.account_name || 'Unknown Vendor', 
        lineItems, 
        payments as GlVendorPayment[] || []
      );
      
      // Add vendor payments to the result for UI purposes
      return {
        ...purchaseOrder,
        vendorPayments: (payments || []).map(payment => ({
          id: payment.id,
          date: payment.date_of_payment ? new Date(payment.date_of_payment) : null,
          amount: Number(payment.payment_amount) || 0,
          method: 'Payment',
          notes: payment.vendor_purchase_note || ''
        }))
      };
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
