import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, LineItem } from "@/types";

export type SortOrder = "desc" | "asc";
export type FilterStatus = "all" | "paid" | "overdue" | "draft" | "sent";

const ITEMS_PER_PAGE = 10;

export function useInvoices(
  sortOrder: SortOrder = "desc", 
  currentPage: number = 0,
  filterStatus: FilterStatus = "all",
  searchQuery: string = ""
) {
  const [totalCount, setTotalCount] = useState(0);

  const { data: invoices = [], isLoading, error } = useQuery({
    queryKey: ['invoices', sortOrder, currentPage, filterStatus, searchQuery],
    queryFn: async () => {
      try {
        // Get total count of invoices
        const countQuery = supabase
          .from('gl_invoices')
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

        // Fetch invoices with pagination
        let query = supabase
          .from('gl_invoices')
          .select(`
            id,
            number,
            date,
            due_date,
            account_id,
            estimate_id,
            subtotal,
            tax,
            total,
            notes,
            status,
            payment_terms,
            payment_date,
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
          
        const { data: invoiceData, error: invoiceError } = await query
          .order('date', { ascending: sortOrder === 'asc' })
          .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

        if (invoiceError) throw invoiceError;
        if (!invoiceData) return [];

        // Get all invoice IDs
        const invoiceIds = invoiceData.map(inv => inv.id);
        
        // Fetch line items for these invoices
        const { data: lineItems = [], error: lineItemsError } = await supabase
          .from('gl_invoice_lines')
          .select(`
            id,
            invoice_id,
            product_id,
            description,
            quantity,
            unit_price,
            total
          `)
          .in('invoice_id', invoiceIds);

        if (lineItemsError) {
          console.error('Error fetching line items:', lineItemsError);
        }

        // Fetch all customer payments for these invoices
        const { data: payments = [], error: paymentsError } = await supabase
          .from('gl_customer_payments')
          .select(`
            id,
            invoice_id,
            amount,
            date,
            payment_method,
            notes,
            account_id,
            created_at,
            updated_at
          `)
          .in('invoice_id', invoiceIds);

        if (paymentsError) {
          console.error('Error fetching customer payments:', paymentsError);
        }

        // Get customer names for each invoice
        const { data: accounts = [], error: accountsError } = await supabase
          .from('gl_accounts')
          .select(`id, name`)
          .in('id', invoiceData.map(inv => inv.account_id).filter(Boolean));

        if (accountsError) {
          console.error('Error fetching accounts:', accountsError);
        }

        // Create a mapping of account ID to name
        const accountMap = new Map(accounts.map(a => [a.id, a.name]));

        // Enrich invoice data with line items and payments
        const enrichedInvoices = invoiceData.map(inv => {
          const invoiceLineItems = (lineItems || [])
            .filter(item => item.invoice_id === inv.id);

          const invoicePayments = (payments || [])
            .filter(payment => payment.invoice_id === inv.id);

          const customerName = inv.account_id ? accountMap.get(inv.account_id) || 'Unknown Customer' : 'Unknown Customer';

          const amountPaid = invoicePayments.reduce(
            (sum, payment) => sum + (Number(payment.amount) || 0),
            0
          );

          const balance = inv.total - amountPaid;

          return {
            ...inv,
            accountName: customerName,
            lineItems: invoiceLineItems as LineItem[],
            amountPaid,
            balance
          } as Invoice;
        });

        return enrichedInvoices;
      } catch (error) {
        console.error('Error fetching invoices:', error);
        throw error;
      }
    }
  });

  return {
    invoices,
    isLoading,
    error,
    totalCount,
    totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
    currentPage
  };
} 