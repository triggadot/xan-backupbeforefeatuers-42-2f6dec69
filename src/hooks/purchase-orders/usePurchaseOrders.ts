import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder, PurchaseOrderFilters } from '@/types/purchase-orders/purchaseOrder';
import { GlAccount } from '@/types';

export function usePurchaseOrders(filters: PurchaseOrderFilters = {}) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [filters]);

  const fetchPurchaseOrders = async () => {
    setIsLoading(true);
    setError(null);
    console.log('Fetching purchase orders with filters:', filters);

    try {
      // Fetch purchase orders
      let query = supabase
        .from('gl_purchase_orders')
        .select('*');

      // Apply filters if provided
      if (filters.status) {
        query = query.eq('payment_status', filters.status);
      }

      if (filters.vendorId) {
        query = query.eq('rowid_accounts', filters.vendorId);
      }

      if (filters.fromDate) {
        query = query.gte('po_date', filters.fromDate.toISOString());
      }

      if (filters.toDate) {
        query = query.lte('po_date', filters.toDate.toISOString());
      }

      const { data: purchaseOrderData, error: purchaseOrderError } = await query;
      console.log('Purchase order data from DB:', purchaseOrderData);

      if (purchaseOrderError) throw purchaseOrderError;

      // Fetch accounts (vendors)
      const { data: accountData, error: accountError } = await supabase
        .from('gl_accounts')
        .select('*');

      console.log('Account data from DB:', accountData);
      if (accountError) throw accountError;

      // Create a lookup map for accounts
      const accountMap = new Map();
      if (accountData) {
        accountData.forEach((account: GlAccount) => {
          accountMap.set(account.glide_row_id, account);
        });
      }
      console.log('Account map created with keys:', Array.from(accountMap.keys()));

      // Process purchase orders
      const processedPurchaseOrders: PurchaseOrder[] = [];
      if (purchaseOrderData) {
        for (const po of purchaseOrderData) {
          // Get vendor information
          let vendor = null;
          let vendorName = '';
          if (po.rowid_accounts) {
            vendor = accountMap.get(po.rowid_accounts);
            vendorName = vendor?.account_name || '';
            console.log(`Vendor for PO ${po.id}:`, { vendorId: po.rowid_accounts, vendorFound: !!vendor, vendorName });
          }

          // Create purchase order object
          const purchaseOrder: PurchaseOrder = {
            id: po.id,
            glide_row_id: po.glide_row_id,
            number: po.purchase_order_uid,
            date: po.po_date,
            status: po.payment_status || 'draft',
            vendorId: po.rowid_accounts,
            vendorName,
            vendor,
            total_amount: po.total_amount || 0,
            total_paid: po.total_paid || 0,
            balance: po.balance || 0,
            created_at: po.created_at,
            lineItems: [],
            vendorPayments: []
          };

          processedPurchaseOrders.push(purchaseOrder);
        }
      }

      console.log('Processed purchase orders:', processedPurchaseOrders);

      // Sort by date (newest first)
      processedPurchaseOrders.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });

      setPurchaseOrders(processedPurchaseOrders);
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
