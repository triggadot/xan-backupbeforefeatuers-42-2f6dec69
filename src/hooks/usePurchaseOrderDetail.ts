import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder, PurchaseOrderLineItem } from '@/types/purchaseOrder';
import { GlAccount } from '@/types';

export function usePurchaseOrderDetail(id: string) {
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchPurchaseOrderDetail(id);
    }
  }, [id]);

  const fetchPurchaseOrderDetail = async (purchaseOrderId: string) => {
    setIsLoading(true);
    setError(null);
    console.log('Fetching purchase order detail for ID:', purchaseOrderId);

    try {
      // Fetch purchase order
      const { data: purchaseOrderData, error: purchaseOrderError } = await supabase
        .from('gl_purchase_orders')
        .select('*')
        .eq('id', purchaseOrderId)
        .single();

      console.log('Purchase order data from DB:', purchaseOrderData);
      if (purchaseOrderError) throw purchaseOrderError;

      if (!purchaseOrderData) {
        setError('Purchase order not found');
        setIsLoading(false);
        return;
      }

      // Fetch accounts (vendors)
      const { data: accountData, error: accountError } = await supabase
        .from('gl_accounts')
        .select('*');

      console.log('Account data from DB:', accountData);
      if (accountError) throw accountError;

      // Fetch products that serve as purchase order line items
      // First try using rowid_purchase_orders
      const { data: productData1, error: productError1 } = await supabase
        .from('gl_products')
        .select('*')
        .eq('rowid_purchase_orders', purchaseOrderData.glide_row_id);

      console.log('Product data from DB (using rowid_purchase_orders):', productData1);
      
      // Also try using purchase_order_uid
      const { data: productData2, error: productError2 } = await supabase
        .from('gl_products')
        .select('*')
        .eq('purchase_order_uid', purchaseOrderData.purchase_order_uid);
        
      console.log('Product data from DB (using purchase_order_uid):', productData2);
      
      // Combine results, removing duplicates
      let productData = [];
      if (productData1) {
        productData = [...productData1];
      }
      
      if (productData2) {
        // Add products from second query that aren't already in the result
        productData2.forEach(product => {
          if (!productData.some(p => p.id === product.id)) {
            productData.push(product);
          }
        });
      }
      
      console.log('Combined product data:', productData);
      
      // Check if we have any products at all
      if (!productData || productData.length === 0) {
        // Try a more direct query to see all products
        const { data: allProducts } = await supabase
          .from('gl_products')
          .select('*')
          .limit(5);
          
        console.log('Sample of all products in database:', allProducts);
        
        // Check the schema of the products table
        if (allProducts && allProducts.length > 0) {
          console.log('Product table schema (from first product):', Object.keys(allProducts[0]));
          console.log('Does vendor_product_name exist in schema?', 'vendor_product_name' in allProducts[0]);
        }
      }
      
      // Add detailed logging for each product
      if (productData && productData.length > 0) {
        productData.forEach((product, index) => {
          console.log(`Product ${index} details:`, {
            id: product.id,
            glide_row_id: product.glide_row_id,
            vendor_product_name: product.vendor_product_name,
            new_product_name: product.new_product_name,
            display_name: product.display_name,
            purchase_order_uid: product.purchase_order_uid
          });
        });
      } else {
        console.log('No products found for this purchase order');
      }
      
      if (productError1) console.error('Error fetching products using rowid_purchase_orders:', productError1);
      if (productError2) console.error('Error fetching products using purchase_order_uid:', productError2);
      
      if (productError1 && productError2) throw productError1;

      // Fetch vendor payments
      const { data: paymentData, error: paymentError } = await supabase
        .from('gl_vendor_payments')
        .select('*')
        .eq('rowid_purchase_orders', purchaseOrderData.glide_row_id);

      console.log('Payment data from DB:', paymentData);
      if (paymentError) throw paymentError;

      // Create lookup maps for related data
      const accountMap = new Map();
      if (accountData) {
        accountData.forEach((account: GlAccount) => {
          accountMap.set(account.glide_row_id, account);
        });
      }
      console.log('Account map created with keys:', Array.from(accountMap.keys()));

      // Process line items (products)
      const lineItems: PurchaseOrderLineItem[] = [];
      if (productData) {
        productData.forEach((product: any) => {
          console.log('Processing product:', product);
          console.log('Vendor product name:', product.vendor_product_name);
          
          // Check if vendor_product_name exists in the raw data
          const hasVendorProductName = 'vendor_product_name' in product;
          console.log('Has vendor_product_name field:', hasVendorProductName);
          
          const lineItem: PurchaseOrderLineItem = {
            id: product.id,
            quantity: product.total_qty_purchased || 0,
            unitPrice: product.cost || 0,
            total: (product.total_qty_purchased || 0) * (product.cost || 0),
            description: product.purchase_notes || '',
            productId: product.glide_row_id,
            product_name: product.new_product_name || 'Unnamed Product',
            new_product_name: product.new_product_name || '',
            // Explicitly handle vendor_product_name, with fallback and debug info
            vendor_product_name: hasVendorProductName ? product.vendor_product_name || '' : '[Field missing]',
            display_name: product.display_name || product.new_product_name || product.vendor_product_name || 'Unnamed Product',
            unit_price: product.cost || 0,
            notes: product.purchase_notes || '',
            samples: product.samples || false,
            fronted: product.fronted || false,
            category: product.category || '',
            total_units: product.total_qty_purchased || 0
          };
          
          console.log('Created line item with vendor_product_name:', lineItem.vendor_product_name);
          lineItems.push(lineItem);
        });
      }
      console.log('Processed line items:', lineItems);

      // Process payments
      const payments = paymentData ? paymentData.map((payment: any) => ({
        id: payment.id,
        amount: payment.payment_amount || 0,
        date: payment.date_of_payment,
        method: payment.payment_method || '',
        notes: payment.vendor_purchase_note || ''
      })) : [];
      console.log('Processed payments:', payments);

      // Calculate totals
      const totalUnits = lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const totalCost = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);

      // Combine data
      const purchaseOrderWithDetails: PurchaseOrder = {
        ...purchaseOrderData,
        id: purchaseOrderData.id,
        glide_row_id: purchaseOrderData.glide_row_id,
        number: purchaseOrderData.purchase_order_uid,
        date: purchaseOrderData.po_date,
        status: purchaseOrderData.payment_status || 'draft',
        total_amount: purchaseOrderData.total_amount || totalCost || 0,
        total_paid: purchaseOrderData.total_paid || 0,
        balance: purchaseOrderData.balance || (purchaseOrderData.total_amount - purchaseOrderData.total_paid) || 0,
        lineItems,
        vendorPayments: payments,
        created_at: purchaseOrderData.created_at,
        totalUnits,
        totalCost
      };

      // Add vendor information
      if (purchaseOrderData.rowid_accounts) {
        const vendor = accountMap.get(purchaseOrderData.rowid_accounts);
        if (vendor) {
          purchaseOrderWithDetails.vendor = vendor;
          purchaseOrderWithDetails.vendorName = vendor.account_name;
          console.log('Vendor found for purchase order:', vendor.account_name);
        } else {
          console.log('No vendor found for rowid_accounts:', purchaseOrderData.rowid_accounts);
        }
      }

      console.log('Final purchase order with details:', purchaseOrderWithDetails);
      setPurchaseOrder(purchaseOrderWithDetails);
    } catch (err) {
      console.error('Error fetching purchase order details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching purchase order details');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    purchaseOrder,
    isLoading,
    error,
    fetchPurchaseOrderDetail
  };
}
