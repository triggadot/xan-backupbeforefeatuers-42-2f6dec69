import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder } from '@/types/purchase-orders';

export function usePurchaseOrderDetail(id: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  
  const getPurchaseOrder = useCallback(async (purchaseOrderId: string): Promise<PurchaseOrder | null> => {
    if (!purchaseOrderId) {
      setError('No purchase order ID provided');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('gl_purchase_orders')
        .select(`
          *,
          gl_accounts!gl_purchase_orders_rowid_accounts_fkey(
            id, glide_row_id, account_name
          )
        `)
        .eq('id', purchaseOrderId)
        .single();
      
      if (error) throw error;
      
      // Fetch products associated with this purchase order
      let products = [];
      
      if (data.glide_row_id) {
        const { data: productsData, error: productsError } = await supabase
          .from('gl_products')
          .select('*')
          .eq('rowid_purchase_orders', data.glide_row_id);
        
        if (productsError) {
          console.error('Error fetching products:', productsError);
        } else {
          products = productsData || [];
        }
      }
      
      // Try alternate method if no products found
      if (!products.length && data.purchase_order_uid) {
        const { data: altProductsData, error: altProductsError } = await supabase
          .from('gl_products')
          .select('*')
          .eq('purchase_order_uid', data.purchase_order_uid);
          
        if (altProductsError) {
          console.error('Error fetching products with purchase_order_uid:', altProductsError);
        } else if (altProductsData && altProductsData.length > 0) {
          products = [...altProductsData];
        }
      }
      
      // Debug: Log product data
      console.log('Products found for PO:', products.length);
      if (products.length > 0) {
        console.log('First product sample:', {
          id: products[0].id,
          vendor_product_name: products[0].vendor_product_name,
          new_product_name: products[0].new_product_name,
          display_name: products[0].display_name
        });
      }
      
      // Create line items from products
      const lineItems = products.map(product => ({
        id: product.id,
        productId: product.glide_row_id || product.id,
        productName: product.display_name || product.new_product_name || product.vendor_product_name || 'Unnamed Product',
        quantity: product.total_qty_purchased || 0,
        price: product.cost || 0,
        notes: product.purchase_notes || ''
      }));
      
      // Map the data to match our PurchaseOrder interface
      const mappedPurchaseOrder: PurchaseOrder = {
        id: data.id,
        glideRowId: data.glide_row_id,
        status: data.payment_status,
        poDate: data.po_date,
        date: data.po_date,
        totalAmount: data.total_amount,
        totalPaid: data.total_paid,
        balance: data.balance,
        vendorId: data.rowid_accounts,
        vendorName: data.gl_accounts?.[0]?.account_name || 'Unknown Vendor',
        number: data.purchase_order_uid || '',
        pdfLink: data.pdf_link || '',
        notes: '', // Default empty notes field
        lineItems: lineItems, // Populate line items from products
        vendorPayments: [], // Add empty vendor payments
        created_at: data.created_at,
        updated_at: data.updated_at,
        // Add products to the purchase order
        products: products.map(product => ({
          id: product.id,
          glide_row_id: product.glide_row_id,
          new_product_name: product.new_product_name,
          vendor_product_name: product.vendor_product_name,
          display_name: product.display_name || product.new_product_name || product.vendor_product_name || 'Unnamed Product',
          total_qty_purchased: product.total_qty_purchased || 0,
          cost: product.cost || 0,
          purchase_notes: product.purchase_notes || '',
          samples: product.samples || false,
          fronted: product.fronted || false,
          category: product.category || '',
          product_image1: product.product_image1 || '',
        })),
        // Calculate product count
        product_count: products.length
      };
      
      setPurchaseOrder(mappedPurchaseOrder);
      return mappedPurchaseOrder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching purchase order';
      setError(errorMessage);
      console.error('Error in usePurchaseOrderDetail.getPurchaseOrder:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (id) {
      getPurchaseOrder(id);
    }
  }, [id, getPurchaseOrder]);
  
  return {
    purchaseOrder,
    isLoading,
    error,
    getPurchaseOrder
  };
}
