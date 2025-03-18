import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PurchaseOrder, LineItem } from "@/types";
import { Database } from "@/integrations/supabase/types";

export type SortOrder = "desc" | "asc";
export type FilterStatus = "all" | "paid" | "partial" | "unpaid";

const ITEMS_PER_PAGE = 10;

export function usePurchaseOrders(
  sortOrder: SortOrder = "desc", 
  currentPage: number = 0,
  filterStatus: FilterStatus = "all",
  searchQuery: string = ""
) {
  const [totalCount, setTotalCount] = useState(0);

  const { data: purchaseOrders = [], isLoading, error } = useQuery({
    queryKey: ['purchase-orders', sortOrder, currentPage, filterStatus, searchQuery],
    queryFn: async () => {
      try {
        // Get total count of purchase orders
        const countQuery = supabase
          .from('gl_purchase_orders')
          .select('*', { count: 'exact', head: true });
          
        // Add status filter if needed
        if (filterStatus !== 'all') {
          countQuery.eq('status', filterStatus.toUpperCase());
        }
        
        // Add search filter if provided
        if (searchQuery) {
          countQuery.ilike('number', `%${searchQuery}%`);
        }
        
        const { count, error: countError } = await countQuery;

        if (countError) throw countError;
        if (count !== null) {
          setTotalCount(count);
        }

        // Fetch purchase orders with pagination
        let query = supabase
          .from('gl_purchase_orders')
          .select(`
            id,
            number,
            date,
            due_date,
            expected_delivery_date,
            account_id,
            subtotal,
            tax,
            total,
            notes,
            status,
            created_at,
            updated_at
          `);
          
        // Add status filter if needed
        if (filterStatus !== 'all') {
          query.eq('status', filterStatus.toUpperCase());
        }
        
        // Add search filter if provided
        if (searchQuery) {
          query.ilike('number', `%${searchQuery}%`);
        }
          
        const { data: poData, error: poError } = await query
          .order('date', { ascending: sortOrder === 'asc' })
          .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

        if (poError) throw poError;
        if (!poData) return [];

        // Get all PO IDs
        const poIds = poData.map(po => po.id);
        
        // Fetch line items for these purchase orders
        const { data: lineItems = [], error: lineItemsError } = await supabase
          .from('gl_purchase_order_items')
          .select(`
            id,
            purchase_order_id,
            product_id,
            description,
            quantity,
            unit_price,
            total
          `)
          .in('purchase_order_id', poIds);

        if (lineItemsError) {
          console.error('Error fetching line items:', lineItemsError);
        }

        // Fetch all vendor payments for these purchase orders
        const { data: payments = [], error: paymentsError } = await supabase
          .from('gl_vendor_payments')
          .select(`
            id,
            purchase_order_id,
            amount,
            date,
            payment_method,
            notes,
            account_id,
            created_at,
            updated_at
          `)
          .in('purchase_order_id', poIds);

        if (paymentsError) {
          console.error('Error fetching vendor payments:', paymentsError);
        }

        // Get vendor names for each purchase order
        const { data: accounts = [], error: accountsError } = await supabase
          .from('gl_accounts')
          .select(`id, name`)
          .in('id', poData.map(po => po.account_id).filter(Boolean));

        if (accountsError) {
          console.error('Error fetching accounts:', accountsError);
        }

        // Create a mapping of account ID to name
        const accountMap = new Map(accounts.map(a => [a.id, a.name]));

        // Enrich purchase order data with line items and payments
        const enrichedPOs = poData.map(po => {
          const poLineItems = (lineItems || [])
            .filter(item => item.purchase_order_id === po.id);

          const poPayments = (payments || [])
            .filter(payment => payment.purchase_order_id === po.id);

          const vendorName = po.account_id ? accountMap.get(po.account_id) || 'Unknown Vendor' : 'Unknown Vendor';

          const totalPayments = poPayments.reduce(
            (sum, payment) => sum + (Number(payment.amount) || 0),
            0
          );

          const balance = po.total - totalPayments;

          // Determine payment status
          let paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';
          if (totalPayments >= po.total) {
            paymentStatus = 'PAID';
          } else if (totalPayments > 0) {
            paymentStatus = 'PARTIAL';
          }

          return {
            ...po,
            accountName: vendorName,
            lineItems: poLineItems as LineItem[],
            amountPaid: totalPayments,
            balance,
            paymentStatus
          } as PurchaseOrder & { paymentStatus: string };
        });

        return enrichedPOs;
      } catch (error) {
        console.error('Error fetching purchase orders:', error);
        throw error;
      }
    }
  });

  return {
    purchaseOrders,
    isLoading,
    error,
    totalCount,
    totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
    currentPage
  };
} 