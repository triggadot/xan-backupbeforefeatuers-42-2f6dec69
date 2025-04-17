import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/utils/use-toast';
import { BusinessMetrics, StatusMetrics } from '@/types/financial-overviews/business';
import { determineAccountType, extractAccountFlags } from '@/types/accounts/accountMapper';
import { UnpaidProduct } from '@/types/products';

/**
 * Hook for fetching and managing business dashboard metrics
 * 
 * This hook provides functionality to fetch and manage various business metrics
 * for the dashboard, including account statistics, invoice metrics, purchase order
 * metrics, estimate metrics, and unpaid inventory information.
 * 
 * @returns {Object} Dashboard data and utility functions
 * @returns {BusinessMetrics|null} metrics - Overall business metrics
 * @returns {StatusMetrics[]} statusMetrics - Status metrics for invoices, POs, and estimates
 * @returns {Object} unpaidInventory - Information about unpaid inventory items
 * @returns {boolean} isLoading - Loading state indicator
 * @returns {string|null} error - Error message if any
 * @returns {Function} fetchDashboardData - Function to fetch all dashboard data
 */
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
   * 
   * @returns {Promise<void>}
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
            ...item,
            vendor_name: vendorName,
            unpaid_value: unpaidValue
          };
        });
      
      const frontedData = unpaidProducts
        .filter(item => item.fronted === true)
        .map(item => {
          const account = accountsMap.get(item.rowid_accounts);
          const vendorName = account ? account.account_name : 'Unknown Vendor';
          const unpaidValue = Number(item.cost || 0) * Number(item.total_qty_purchased || 0);
          
          return {
            ...item,
            vendor_name: vendorName,
            unpaid_value: unpaidValue
          };
        });
      
      // Calculate totals
      const totalUnpaidItems = samplesData.length + frontedData.length;
      const totalUnpaidValue = [
        ...samplesData.map(item => item.unpaid_value),
        ...frontedData.map(item => item.unpaid_value)
      ].reduce((sum, value) => sum + (value || 0), 0);
      
      setUnpaidInventory({
        samples: samplesData,
        fronted: frontedData,
        total: totalUnpaidItems,
        totalValue: totalUnpaidValue
      });
      
      // Set the overall business metrics
      setMetrics({
        total_customers: totalCustomers,
        total_vendors: totalVendors,
        total_invoices: invoiceMetrics.length,
        total_purchase_orders: poMetrics.length,
        total_estimates: estimateMetrics.length,
        total_products: productsResponse.count || 0,
        total_invoice_amount: totalInvoiceAmount,
        total_payments_received: totalPaymentsReceived,
        total_outstanding_balance: totalOutstandingBalance,
        total_purchase_amount: totalPurchaseAmount,
        total_payments_made: totalPaymentsMade,
        total_purchase_balance: totalPurchaseBalance,
        unpaid_inventory_count: totalUnpaidItems,
        unpaid_inventory_value: totalUnpaidValue
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Dashboard Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    metrics,
    statusMetrics,
    unpaidInventory,
    isLoading,
    error,
    fetchDashboardData
  };
}
