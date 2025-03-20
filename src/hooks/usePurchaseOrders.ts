import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder, PurchaseOrderFilters } from '@/types/purchaseOrder';

interface PurchaseOrderDBResponse {
  id?: string;
  po_id?: string;
  glide_row_id: string;
  balance: number;
  created_at: string;
  docs_shortlink: string;
  last_payment_date: string;
  payment_count: number;
  payment_status: string;
  pdf_link: string;
  po_date: string;
  product_count: number;
  purchase_order_uid: string;
  total_amount: number;
  total_paid: number;
  updated_at: string;
  vendor_glide_id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_uid: string;
}

export function usePurchaseOrders() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchPurchaseOrders = async (filters?: PurchaseOrderFilters) => {
    setIsLoading(true);
    setError('');
    
    try {
      let query = supabase
        .from('mv_purchase_order_vendor_details')
        .select('*');
      
      if (filters?.search) {
        query = query.or(`vendor_name.ilike.%${filters.search}%,purchase_order_uid.ilike.%${filters.search}%`);
      }
      
      if (filters?.status && filters.status.length > 0) {
        query = query.in('payment_status', filters.status[0]);
      }
      
      if (filters?.accountId) {
        query = query.eq('vendor_id', filters.accountId);
      }
      
      if (filters?.dateFrom) {
        query = query.gte('po_date', filters.dateFrom.toISOString());
      }
      
      if (filters?.dateTo) {
        query = query.lte('po_date', filters.dateTo.toISOString());
      }
      
      const { data, error: supabaseError } = await query.order('created_at', { ascending: false });
      
      if (supabaseError) throw supabaseError;
      
      const mappedPurchaseOrders: PurchaseOrder[] = (data || []).map(po => ({
        id: po.id || po.po_id || po.glide_row_id,
        glide_row_id: po.glide_row_id,
        purchase_order_uid: po.purchase_order_uid,
        number: po.purchase_order_uid || `PO-${po.id.substring(0, 8)}`,
        rowid_accounts: po.vendor_id,
        accountId: po.vendor_id,
        accountName: po.vendor_name || 'Unknown Vendor',
        po_date: po.po_date,
        date: po.po_date ? new Date(po.po_date) : new Date(po.created_at),
        payment_status: po.payment_status || 'draft',
        status: mapPaymentStatusToStatus(po.payment_status),
        total_amount: Number(po.total_amount || 0),
        total_paid: Number(po.total_paid || 0),
        balance: Number(po.balance || 0),
        product_count: Number(po.product_count || 0),
        created_at: po.created_at,
        updated_at: po.updated_at,
        docs_shortlink: po.docs_shortlink,
        vendor_uid: po.vendor_uid,
        lineItems: [],
        vendorPayments: []
      }));
      
      return { data: mappedPurchaseOrders, error: null };
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return { data: [], error: err };
    } finally {
      setIsLoading(false);
    }
  };

  const getPurchaseOrder = async (id: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const { data: po, error: poError } = await supabase
        .from('mv_purchase_order_vendor_details')
        .select('*')
        .eq('id', id)
        .single();
      
      if (poError) throw poError;
      
      const { data: products, error: productsError } = await supabase
        .from('gl_products')
        .select('*')
        .eq('rowid_purchase_orders', po.glide_row_id);
      
      if (productsError) throw productsError;
      
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_vendor_payments')
        .select('*')
        .eq('rowid_purchase_orders', po.glide_row_id);
      
      if (paymentsError) throw paymentsError;
      
      const purchaseOrder: PurchaseOrder = {
        id: po.id || po.po_id || po.glide_row_id,
        glide_row_id: po.glide_row_id,
        purchase_order_uid: po.purchase_order_uid,
        number: po.purchase_order_uid || `PO-${po.id.substring(0, 8)}`,
        rowid_accounts: po.vendor_id,
        accountId: po.vendor_id,
        accountName: po.vendor_name || 'Unknown Vendor',
        po_date: po.po_date,
        date: po.po_date ? new Date(po.po_date) : new Date(po.created_at),
        payment_status: po.payment_status || 'draft',
        status: mapPaymentStatusToStatus(po.payment_status),
        total_amount: Number(po.total_amount || 0),
        total_paid: Number(po.total_paid || 0),
        balance: Number(po.balance || 0),
        product_count: Number(po.product_count || 0),
        created_at: po.created_at,
        updated_at: po.updated_at,
        docs_shortlink: po.docs_shortlink,
        vendor_uid: po.vendor_uid,
        lineItems: (products || []).map(product => ({
          id: product.id,
          rowid_products: product.glide_row_id,
          product_name: product.display_name || product.new_product_name || product.vendor_product_name || 'Unnamed Product',
          quantity: Number(product.total_qty_purchased || 0),
          unit_price: Number(product.cost || 0),
          total: Number(product.total_qty_purchased || 0) * Number(product.cost || 0),
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
        })),
        vendorPayments: (payments || []).map(payment => ({
          id: payment.id,
          date: payment.date_of_payment ? new Date(payment.date_of_payment) : new Date(),
          amount: Number(payment.payment_amount || 0),
          method: '',
          notes: payment.vendor_purchase_note || ''
        }))
      };
      
      return purchaseOrder;
    } catch (err) {
      console.error('Error fetching purchase order details:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createPurchaseOrder = async (data: Partial<PurchaseOrder>) => {
    setIsLoading(true);
    setError('');
    
    try {
      const glideRowId = `PO-${Date.now()}`;
      
      const { data: newPO, error: poError } = await supabase
        .from('gl_purchase_orders')
        .insert({
          glide_row_id: glideRowId,
          rowid_accounts: data.accountId,
          purchase_order_uid: data.number || `PO#${Date.now()}`,
          po_date: data.date?.toISOString() || new Date().toISOString(),
          docs_shortlink: data.docs_shortlink
        })
        .select()
        .single();
      
      if (poError) throw poError;
      
      toast({
        title: "Purchase Order Created",
        description: "The purchase order has been created successfully.",
      });
      
      return newPO;
    } catch (err) {
      console.error('Error creating purchase order:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create purchase order',
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const mapPaymentStatusToStatus = (paymentStatus?: string): PurchaseOrder['status'] => {
    if (!paymentStatus) return 'draft';
    
    switch (paymentStatus.toLowerCase()) {
      case 'paid':
        return 'complete';
      case 'partial':
        return 'partial';
      case 'unpaid':
        return 'sent';
      case 'received':
        return 'received';
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
