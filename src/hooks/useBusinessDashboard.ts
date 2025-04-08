import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BusinessMetrics, StatusMetrics } from '@/types/business';
import { determineAccountType, extractAccountFlags } from '@/utils/accountMapper';
import { UnpaidProduct } from '@/types/product';

export function useBusinessDashboard() {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [statusMetrics, setStatusMetrics] = useState<StatusMetrics[]>([]);
  const [unpaidInventory, setUnpaidInventory] = useState<{
    samples: UnpaidProduct[];
    fronted: UnpaidProduct[];
    total: number;
    totalValue: number;
  }>({
    samples: [],
    fronted: [],
    total: 0,
    totalValue: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Fetches all dashboard data in a single function
   * This reduces the number of loading states and provides a unified data refresh
   */
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel for better performance
      const [
        accountsResponse,
        invoicesResponse,
        estimatesResponse,
        purchaseOrdersResponse,
        productsResponse,
        unpaidInventoryResponse
      ] = await Promise.all([
        // Account metrics
        supabase
          .from('gl_accounts')
          .select('id, client_type'),
        
        // Invoice metrics
        supabase
          .from('gl_invoices')
          .select('id, total_amount, total_paid, balance, payment_status', { count: 'exact' }),
        
        // Estimate metrics
        supabase
          .from('gl_estimates')
          .select('id, status', { count: 'exact' }),
        
        // Purchase order metrics
        supabase
          .from('gl_purchase_orders')
          .select('id, total_amount, total_paid, balance, payment_status', { count: 'exact' }),
        
        // Product metrics
        supabase
          .from('gl_products')
          .select('id', { count: 'exact' }),
        
        // Unpaid inventory - products that are samples or fronted
        supabase
          .from('gl_products')
          .select('*')
          .or('samples.eq.true,fronted.eq.true')
      ]);
      
      // Handle any errors from the parallel requests
      const errors = [
        accountsResponse.error, 
        invoicesResponse.error,
        estimatesResponse.error,
        purchaseOrdersResponse.error,
        productsResponse.error,
        unpaidInventoryResponse.error
      ].filter(Boolean);
      
      if (errors.length > 0) {
        throw new Error(`Error fetching dashboard data: ${errors.map(e => e?.message).join(', ')}`);
      }
      
      // Process account metrics
      const accountMetrics = accountsResponse.data;
      let totalCustomers = 0;
      let totalVendors = 0;
      
      if (accountMetrics) {
        accountMetrics.forEach(account => {
          const { is_customer, is_vendor } = extractAccountFlags(
            account.client_type as 'Customer' | 'Vendor' | 'Customer & Vendor'
          );
          if (is_customer) totalCustomers++;
          if (is_vendor) totalVendors++;
        });
      }
      
      // Process invoice metrics
      const invoiceMetrics = invoicesResponse.data || [];
      const totalInvoiceAmount = invoiceMetrics.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
      const totalPaymentsReceived = invoiceMetrics.reduce((sum, invoice) => sum + (invoice.total_paid || 0), 0);
      const totalOutstandingBalance = invoiceMetrics.reduce((sum, invoice) => sum + (invoice.balance || 0), 0);
      
      // Calculate invoice status counts
      const invoicePaidCount = invoiceMetrics.filter(i => i.payment_status === 'paid').length;
      const invoiceUnpaidCount = invoiceMetrics.filter(i => i.payment_status === 'partial' || i.payment_status === 'sent' || i.payment_status === 'overdue').length;
      const invoiceDraftCount = invoiceMetrics.filter(i => i.payment_status === 'draft').length;
      
      // Process purchase order metrics
      const poMetrics = purchaseOrdersResponse.data || [];
      const totalPurchaseAmount = poMetrics.reduce((sum, po) => sum + (po.total_amount || 0), 0);
      const totalPaymentsMade = poMetrics.reduce((sum, po) => sum + (po.total_paid || 0), 0);
      const totalPurchaseBalance = poMetrics.reduce((sum, po) => sum + (po.balance || 0), 0);
      
      // Calculate purchase order status counts
      const poPaidCount = poMetrics.filter(po => po.payment_status === 'paid' || po.payment_status === 'complete').length;
      const poUnpaidCount = poMetrics.filter(po => po.payment_status === 'partial' || po.payment_status === 'pending').length;
      const poDraftCount = poMetrics.filter(po => po.payment_status === 'draft').length;
      
      // Process estimate metrics
      const estimateMetrics = estimatesResponse.data || [];
      
      // Calculate estimate status counts
      const estimatePaidCount = estimateMetrics.filter(e => e.status === 'converted').length;
      const estimateUnpaidCount = estimateMetrics.filter(e => e.status === 'sent').length;
      const estimateDraftCount = estimateMetrics.filter(e => e.status === 'draft').length;
      
      // Create status metrics
      const calculatedStatusMetrics: StatusMetrics[] = [
        {
          category: 'invoices',
          total_count: invoiceMetrics.length,
          paid_count: invoicePaidCount,
          unpaid_count: invoiceUnpaidCount,
          draft_count: invoiceDraftCount,
          total_amount: totalInvoiceAmount,
          total_paid: totalPaymentsReceived,
          balance_amount: totalOutstandingBalance
        },
        {
          category: 'purchase_orders',
          total_count: poMetrics.length,
          paid_count: poPaidCount,
          unpaid_count: poUnpaidCount,
          draft_count: poDraftCount,
          total_amount: totalPurchaseAmount,
          total_paid: totalPaymentsMade,
          balance_amount: totalPurchaseBalance
        },
        {
          category: 'estimates',
          total_count: estimateMetrics.length,
          paid_count: estimatePaidCount,
          unpaid_count: estimateUnpaidCount,
          draft_count: estimateDraftCount,
          total_amount: 0, // Estimates don't typically have amounts in this system
          total_paid: 0,
          balance_amount: 0
        }
      ];
      
      setStatusMetrics(calculatedStatusMetrics);
      
      // Process unpaid inventory
      const unpaidProducts = unpaidInventoryResponse.data || [];
      
      // Fetch accounts for the unpaid products
      const accountIds = [...new Set(unpaidProducts.map(item => item.rowid_accounts).filter(Boolean))];
      
      let accountsMap = new Map();
      if (accountIds.length > 0) {
        const { data: accountsData, error: accountsError } = await supabase
          .from('gl_accounts')
          .select('glide_row_id, account_name')
          .in('glide_row_id', accountIds);
          
        if (accountsError) {
          console.error('Error fetching accounts for unpaid products:', accountsError);
        } else if (accountsData) {
          // Create a lookup map for accounts
          accountsMap = new Map(
            accountsData.map(account => [account.glide_row_id, account])
          );
        }
      }
      
      // Process samples and fronted products
      const samplesData = unpaidProducts
        .filter(item => item.samples === true)
        .map(item => {
          const account = accountsMap.get(item.rowid_accounts);
          const vendorName = account ? account.account_name : 'Unknown Vendor';
          const unpaidValue = Number(item.cost || 0) * Number(item.total_qty_purchased || 0);
          
          return {
            id: item.id,
            product_id: item.glide_row_id || '',
            name: item.display_name || item.vendor_product_name || item.new_product_name || 'Unnamed Product',
            quantity: Number(item.total_qty_purchased || 0),
            unpaid_value: unpaidValue,
            unpaid_type: 'Sample',
            date_created: item.created_at || '',
            created_at: item.created_at || '',
            customer_name: vendorName,
            customer_id: item.rowid_accounts || '',
            product_image: item.product_image1 || '',
            notes: item.purchase_notes || '',
            status: 'active',
            is_sample: true,
            is_fronted: false,
            payment_status: 'unpaid',
            vendor_product_name: item.vendor_product_name || '',
            new_product_name: item.new_product_name || '',
            display_name: item.display_name || '',
            vendor_name: vendorName,
            total_qty_purchased: Number(item.total_qty_purchased || 0),
            cost: Number(item.cost || 0),
            terms_for_fronted_product: item.terms_for_fronted_product || '',
            glide_row_id: item.glide_row_id || ''
          };
        });
      
      // Process fronted items
      const frontedData = unpaidProducts
        .filter(item => item.fronted === true)
        .map(item => {
          const account = accountsMap.get(item.rowid_accounts);
          const vendorName = account ? account.account_name : 'Unknown Vendor';
          const unpaidValue = Number(item.cost || 0) * Number(item.total_qty_purchased || 0);
          
          return {
            id: item.id,
            product_id: item.glide_row_id || '',
            name: item.display_name || item.vendor_product_name || item.new_product_name || 'Unnamed Product',
            quantity: Number(item.total_qty_purchased || 0),
            unpaid_value: unpaidValue,
            unpaid_type: 'Fronted',
            date_created: item.created_at || '',
            created_at: item.created_at || '',
            customer_name: vendorName,
            customer_id: item.rowid_accounts || '',
            product_image: item.product_image1 || '',
            notes: item.purchase_notes || '',
            status: 'active',
            is_sample: false,
            is_fronted: true,
            payment_status: 'unpaid',
            vendor_product_name: item.vendor_product_name || '',
            new_product_name: item.new_product_name || '',
            display_name: item.display_name || '',
            vendor_name: vendorName,
            total_qty_purchased: Number(item.total_qty_purchased || 0),
            cost: Number(item.cost || 0),
            terms_for_fronted_product: item.terms_for_fronted_product || '',
            glide_row_id: item.glide_row_id || ''
          };
        });
      
      // Calculate total unpaid inventory value
      const totalUnpaidItems = samplesData.length + frontedData.length;
      const totalUnpaidValue = [...samplesData, ...frontedData].reduce(
        (sum, item) => sum + item.unpaid_value, 
        0
      );
      
      // Combine all metrics
      const combinedMetrics: BusinessMetrics = {
        total_invoices: invoiceMetrics.length,
        total_estimates: estimateMetrics.length,
        total_purchase_orders: poMetrics.length,
        total_products: productsResponse.data?.length || 0,
        total_customers: totalCustomers,
        total_vendors: totalVendors,
        total_invoice_amount: totalInvoiceAmount,
        total_payments_received: totalPaymentsReceived,
        total_outstanding_balance: totalOutstandingBalance,
        total_purchase_amount: totalPurchaseAmount,
        total_payments_made: totalPaymentsMade,
        total_purchase_balance: totalPurchaseBalance
      };
      
      // Update state with all fetched data
      setMetrics(combinedMetrics);
      setUnpaidInventory({
        samples: samplesData,
        fronted: frontedData,
        total: totalUnpaidItems,
        totalValue: totalUnpaidValue
      });
      
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard data. Please try again later.',
        variant: 'destructive',
      });
      console.error('Dashboard data fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Helper function to calculate total balance
  const calculateTotalBalance = useCallback((total: number, paid: number): number => {
    return total - paid;
  }, []);

  // Helper function to calculate amount due from line items
  const calculateAmountDue = useCallback((lineItems: any[]): number => {
    return lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
  }, []);

  // Helper function to determine invoice status
  const determineInvoiceStatus = useCallback((total: number, paid: number, dueDate?: Date): 'draft' | 'sent' | 'overdue' | 'paid' | 'partial' => {
    if (paid === 0) {
      if (dueDate && dueDate < new Date()) {
        return 'overdue';
      }
      return 'sent';
    } else if (paid < total) {
      return 'partial';
    } else if (paid >= total) {
      return 'paid';
    }
    return 'draft';
  }, []);

  // Helper function to determine purchase order status
  const determinePurchaseOrderStatus = useCallback((total: number, paid: number): 'draft' | 'pending' | 'complete' | 'partial' => {
    if (paid === 0) {
      return 'pending';
    } else if (paid < total) {
      return 'partial';
    } else if (paid >= total) {
      return 'complete';
    }
    return 'draft';
  }, []);

  return {
    metrics,
    statusMetrics,
    unpaidInventory,
    isLoading,
    error,
    refreshDashboard: fetchDashboardData,
    determineAccountType,
    extractAccountFlags,
    calculateTotalBalance,
    calculateAmountDue,
    determineInvoiceStatus,
    determinePurchaseOrderStatus
  };
}
