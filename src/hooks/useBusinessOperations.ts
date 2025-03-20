
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BusinessMetrics, StatusMetrics } from '@/types/business';

export function useBusinessOperations() {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [statusMetrics, setStatusMetrics] = useState<StatusMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBusinessMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch document status metrics from gl_current_status view
      const { data: docStatusData, error: statusError } = await supabase
        .from('gl_current_status')
        .select('category, total_count, paid_count, unpaid_count, draft_count, total_amount, total_paid, balance_amount');
      
      if (statusError) throw statusError;
      
      if (docStatusData) {
        setStatusMetrics(docStatusData as StatusMetrics[]);
      }
      
      // Fetch account metrics using mv_account_details for accurate customer/vendor counts
      const { data: accountMetrics, error: accountError } = await supabase
        .from('mv_account_details')
        .select('account_id, is_customer, is_vendor');
        
      if (accountError) throw accountError;
      
      // Count customers and vendors accurately using is_customer and is_vendor flags
      const totalCustomers = accountMetrics?.filter(account => account.is_customer).length || 0;
      const totalVendors = accountMetrics?.filter(account => account.is_vendor).length || 0;
      
      // Fetch invoice metrics
      const { data: invoiceMetrics, error: invoiceError } = await supabase
        .from('gl_invoices')
        .select('id, total_amount, total_paid, balance', { count: 'exact' });
        
      if (invoiceError) throw invoiceError;
      
      // Fetch estimate metrics
      const { data: estimateMetrics, error: estimateError } = await supabase
        .from('gl_estimates')
        .select('id', { count: 'exact' });
        
      if (estimateError) throw estimateError;
      
      // Fetch purchase order metrics
      const { data: poMetrics, error: poError } = await supabase
        .from('gl_purchase_orders')
        .select('id, total_amount, total_paid, balance', { count: 'exact' });
        
      if (poError) throw poError;
      
      // Fetch product metrics
      const { data: productMetrics, error: productError } = await supabase
        .from('gl_products')
        .select('id', { count: 'exact' });
        
      if (productError) throw productError;
      
      // Calculate totals from invoice data
      const totalInvoiceAmount = invoiceMetrics?.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0) || 0;
      const totalPaymentsReceived = invoiceMetrics?.reduce((sum, invoice) => sum + (invoice.total_paid || 0), 0) || 0;
      const totalOutstandingBalance = invoiceMetrics?.reduce((sum, invoice) => sum + (invoice.balance || 0), 0) || 0;
      
      // Calculate totals from purchase order data
      const totalPurchaseAmount = poMetrics?.reduce((sum, po) => sum + (po.total_amount || 0), 0) || 0;
      const totalPaymentsMade = poMetrics?.reduce((sum, po) => sum + (po.total_paid || 0), 0) || 0;
      const totalPurchaseBalance = poMetrics?.reduce((sum, po) => sum + (po.balance || 0), 0) || 0;
      
      // Combine metrics
      const combinedMetrics: BusinessMetrics = {
        total_invoices: invoiceMetrics?.length || 0,
        total_estimates: estimateMetrics?.length || 0,
        total_purchase_orders: poMetrics?.length || 0,
        total_products: productMetrics?.length || 0,
        total_customers: totalCustomers,
        total_vendors: totalVendors,
        total_invoice_amount: totalInvoiceAmount,
        total_payments_received: totalPaymentsReceived,
        total_outstanding_balance: totalOutstandingBalance,
        total_purchase_amount: totalPurchaseAmount,
        total_payments_made: totalPaymentsMade,
        total_purchase_balance: totalPurchaseBalance
      };
      
      setMetrics(combinedMetrics);
      
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to fetch business metrics. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Helper function to determine account type based on is_customer and is_vendor flags
  const determineAccountType = useCallback((isCustomer: boolean, isVendor: boolean): 'Customer' | 'Vendor' | 'Customer & Vendor' => {
    if (isCustomer && isVendor) {
      return 'Customer & Vendor';
    } else if (isCustomer) {
      return 'Customer';
    } else {
      return 'Vendor';
    }
  }, []);

  // Helper function to extract is_customer and is_vendor from account type
  const extractAccountFlags = useCallback((type: 'Customer' | 'Vendor' | 'Customer & Vendor') => {
    return {
      is_customer: type === 'Customer' || type === 'Customer & Vendor',
      is_vendor: type === 'Vendor' || type === 'Customer & Vendor'
    };
  }, []);

  return {
    metrics,
    statusMetrics,
    isLoading,
    error,
    refreshMetrics: fetchBusinessMetrics,
    determineAccountType,
    extractAccountFlags
  };
}
