
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePurchaseOrderDetail() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPurchaseOrder = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the purchase order details
      const { data, error: fetchError } = await supabase
        .from('gl_purchase_orders')
        .select(`
          *,
          vendor:rowid_accounts(*)
        `)
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Get the products associated with this purchase order
      const { data: products, error: productsError } = await supabase
        .from('gl_products')
        .select('*')
        .eq('rowid_purchase_orders', data.glide_row_id);
        
      if (productsError) throw productsError;
      
      // Get the vendor payments associated with this purchase order
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_vendor_payments')
        .select('*')
        .eq('rowid_purchase_orders', data.glide_row_id);
        
      if (paymentsError) throw paymentsError;
      
      // Map the data to our frontend model
      const mappedProducts = products.map(product => ({
        id: product.id,
        glideRowId: product.glide_row_id,
        name: product.vendor_product_name || product.display_name || 'Unknown Product',
        displayName: product.display_name,
        vendorProductName: product.vendor_product_name,
        newProductName: product.new_product_name,
        cost: Number(product.cost || 0),
        quantity: Number(product.total_qty_purchased || 0),
        totalCost: Number(product.cost || 0) * Number(product.total_qty_purchased || 0),
        category: product.category,
        isSample: product.samples || false,
        isFronted: product.fronted || false,
        isMiscellaneous: product.miscellaneous_items || false,
        purchaseDate: product.product_purchase_date,
        frontedTerms: product.terms_for_fronted_product,
        totalUnitsBehindSample: Number(product.total_units_behind_sample || 0),
        notes: product.purchase_notes || '',
        imageUrl: product.product_image1,
        createdAt: new Date(product.created_at),
        updatedAt: new Date(product.updated_at)
      }));
      
      const mappedPayments = payments.map(payment => ({
        id: payment.id,
        glideRowId: payment.glide_row_id,
        purchaseOrderId: data.id,
        purchaseOrderGlideId: data.glide_row_id,
        vendorId: payment.rowid_accounts,
        amount: Number(payment.payment_amount || 0),
        paymentDate: payment.date_of_payment ? new Date(payment.date_of_payment) : null,
        purchaseOrderDate: payment.date_of_purchase_order ? new Date(payment.date_of_purchase_order) : null,
        notes: payment.vendor_purchase_note || '',
        createdAt: new Date(payment.created_at),
        updatedAt: new Date(payment.updated_at)
      }));
      
      // If data.vendor is valid, extract the vendor name - add null check
      let vendorName = 'Unknown Vendor';
      if (data.vendor && typeof data.vendor === 'object' && data.vendor !== null) {
        vendorName = data.vendor.account_name || 'Unknown Vendor';
      }
      
      // Convert dates
      const poDate = data.po_date ? new Date(data.po_date) : null;
      const paymentDate = data.date_payment_date_mddyyyy ? new Date(data.date_payment_date_mddyyyy) : null;
      
      // Add notes - we'll check if it exists in the data
      const notes = data.notes || '';
      
      // Map the purchase order
      const purchaseOrder = {
        id: data.id,
        glideRowId: data.glide_row_id,
        glide_row_id: data.glide_row_id, // Add this to satisfy PurchaseOrder interface
        vendorId: data.rowid_accounts,
        vendorName,
        poDate,
        paymentDate,
        status: data.payment_status || 'draft',
        total: Number(data.total_amount || 0),
        total_amount: Number(data.total_amount || 0), // Add this to satisfy PurchaseOrder interface
        amountPaid: Number(data.total_paid || 0),
        total_paid: Number(data.total_paid || 0), // Add this to satisfy PurchaseOrder interface
        balance: Number(data.balance || 0),
        productCount: Number(data.product_count || 0),
        pdfLink: data.pdf_link,
        docsShortLink: data.docs_shortlink,
        purchaseOrderUid: data.purchase_order_uid,
        notes, // Use the notes variable from above
        created_at: data.created_at,
        updated_at: data.updated_at,
        products: mappedProducts,
        payments: mappedPayments,
        // Add these fields to match the PurchaseOrder interface
        number: data.purchase_order_uid || '',
        date: data.po_date ? new Date(data.po_date) : new Date(), // Convert to Date instead of string
        // Add lineItems and vendorPayments to match the expected PurchaseOrder interface
        lineItems: mappedProducts.map(p => ({
          id: p.id,
          product_name: p.name,
          description: p.notes,
          quantity: p.quantity,
          unit_price: p.cost,
          unitPrice: p.cost,
          total: p.totalCost,
          rowid_products: p.glideRowId,
          productDetails: {
            id: p.id,
            glide_row_id: p.glideRowId,
            name: p.name,
            display_name: p.displayName,
            vendor_product_name: p.vendorProductName,
            new_product_name: p.newProductName,
            cost: p.cost,
            total_qty_purchased: p.quantity,
            category: p.category,
            product_image1: p.imageUrl,
            purchase_notes: p.notes
          }
        })),
        vendorPayments: mappedPayments.map(p => ({
          id: p.id,
          date: p.paymentDate,
          amount: p.amount,
          method: '',
          notes: p.notes
        }))
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

  return {
    getPurchaseOrder,
    isLoading,
    error
  };
}
