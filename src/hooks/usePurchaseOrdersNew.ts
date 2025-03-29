import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder, PurchaseOrderFilters } from '@/types/purchaseOrder';
import { GlAccount } from '@/types';

export function usePurchaseOrdersNew(filters?: PurchaseOrderFilters) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [filters]);

  const fetchPurchaseOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch purchase orders
      const { data: purchaseOrderData, error: purchaseOrderError } = await supabase
        .from('gl_purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (purchaseOrderError) throw purchaseOrderError;

      if (!purchaseOrderData || purchaseOrderData.length === 0) {
        setPurchaseOrders([]);
        setIsLoading(false);
        return;
      }

      // Fetch accounts (vendors) to join with purchase orders
      const { data: accountData, error: accountError } = await supabase
        .from('gl_accounts')
        .select('*');

      if (accountError) throw accountError;

      // Fetch purchase order line items - using gl_po_lines instead of gl_purchase_order_lines
      const { data: lineItemData, error: lineItemError } = await supabase
        .from('gl_po_lines')
        .select('*');

      if (lineItemError) throw lineItemError;

      // Fetch vendor payments
      const { data: paymentData, error: paymentError } = await supabase
        .from('gl_vendor_payments')
        .select('*');

      if (paymentError) throw paymentError;

      // Create lookup maps for related data
      const accountMap = new Map();
      if (accountData) {
        accountData.forEach((account: GlAccount) => {
          accountMap.set(account.glide_row_id, account);
        });
      }

      // Group line items and payments by purchase order
      const lineItemMap = new Map();
      if (lineItemData) {
        lineItemData.forEach((lineItem: any) => {
          if (lineItem.rowid_po) { // Using rowid_po instead of rowid_purchase_orders
            const lineItems = lineItemMap.get(lineItem.rowid_po) || [];
            lineItems.push({
              id: lineItem.id,
              quantity: lineItem.qty || 0,
              unitPrice: lineItem.price || 0,
              total: lineItem.line_total || 0,
              description: lineItem.notes,
              productId: lineItem.rowid_products,
              product_name: lineItem.product_name || 'Unnamed Product',
              unit_price: lineItem.price,
              notes: lineItem.notes
            });
            lineItemMap.set(lineItem.rowid_po, lineItems);
          }
        });
      }

      const paymentMap = new Map();
      if (paymentData) {
        paymentData.forEach((payment: any) => {
          if (payment.rowid_po) { // Using rowid_po instead of rowid_purchase_orders
            const payments = paymentMap.get(payment.rowid_po) || [];
            payments.push({
              id: payment.id,
              amount: payment.payment_amount || 0,
              date: payment.date_of_payment,
              method: payment.payment_method, // Using payment_method instead of payment_type
              notes: payment.notes // Using notes instead of payment_note
            });
            paymentMap.set(payment.rowid_po, payments);
          }
        });
      }

      // Combine data
      const combinedPurchaseOrders = purchaseOrderData.map((po: any) => {
        const purchaseOrderWithDetails: PurchaseOrder = {
          ...po,
          id: po.id,
          glide_row_id: po.glide_row_id,
          number: po.po_number,
          date: po.po_date,
          status: po.payment_status || 'draft', // Using payment_status as status
          total_amount: po.total_amount || 0,
          total_paid: po.total_paid || 0,
          balance: po.balance || 0,
          notes: po.notes,
          lineItems: lineItemMap.get(po.glide_row_id) || [],
          vendorPayments: paymentMap.get(po.glide_row_id) || [],
          created_at: po.created_at
        };

        // Add vendor information
        if (po.rowid_accounts) {
          const vendor = accountMap.get(po.rowid_accounts);
          if (vendor) {
            purchaseOrderWithDetails.vendor = vendor;
            purchaseOrderWithDetails.vendorName = vendor.account_name;
          }
        }

        return purchaseOrderWithDetails;
      });

      // Apply filters if provided
      let filteredPurchaseOrders = combinedPurchaseOrders;
      
      if (filters) {
        if (filters.status) {
          filteredPurchaseOrders = filteredPurchaseOrders.filter(
            (po) => po.status.toLowerCase() === filters.status?.toLowerCase()
          );
        }
        
        if (filters.vendorId) {
          filteredPurchaseOrders = filteredPurchaseOrders.filter(
            (po) => po.vendor?.id === filters.vendorId
          );
        }
        
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          filteredPurchaseOrders = filteredPurchaseOrders.filter((po) => 
            (po.vendorName?.toLowerCase().includes(searchTerm)) ||
            (po.number?.toLowerCase().includes(searchTerm)) ||
            (po.notes?.toLowerCase().includes(searchTerm))
          );
        }
        
        if (filters.fromDate) {
          const fromDate = new Date(filters.fromDate);
          filteredPurchaseOrders = filteredPurchaseOrders.filter((po) => {
            if (!po.date) return true;
            return new Date(po.date) >= fromDate;
          });
        }
        
        if (filters.toDate) {
          const toDate = new Date(filters.toDate);
          filteredPurchaseOrders = filteredPurchaseOrders.filter((po) => {
            if (!po.date) return true;
            return new Date(po.date) <= toDate;
          });
        }
      }

      setPurchaseOrders(filteredPurchaseOrders);
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching purchase orders');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    purchaseOrders,
    isLoading,
    error,
    fetchPurchaseOrders
  };
}
