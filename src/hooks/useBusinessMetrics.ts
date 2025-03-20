
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BusinessMetrics {
  total_invoices: number;
  total_estimates: number;
  total_purchase_orders: number;
  total_products: number;
  total_customers: number;
  total_vendors: number;
  total_invoice_amount: number;
  total_payments_received: number;
  total_outstanding_balance: number;
  total_purchase_amount: number;
  total_payments_made: number;
  total_purchase_balance: number;
}

export interface StatusMetrics {
  category: string;
  total_count: number;
  paid_count: number;
  unpaid_count: number;
  draft_count: number;
  total_amount: number;
  total_paid: number;
  balance_amount: number;
}

export function useBusinessMetrics() {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [statusMetrics, setStatusMetrics] = useState<StatusMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBusinessMetrics();
  }, []);

  const fetchBusinessMetrics = async () => {
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
      
      // Fetch account metrics using mv_account_details for accurate customer/vendor counts
      const { data: accountMetrics, error: accountError } = await supabase
        .from('mv_account_details')
        .select('id, is_customer, is_vendor');
        
      if (accountError) throw accountError;
      
      // Calculate totals from invoice data
      const totalInvoiceAmount = invoiceMetrics?.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0) || 0;
      const totalPaymentsReceived = invoiceMetrics?.reduce((sum, invoice) => sum + (invoice.total_paid || 0), 0) || 0;
      const totalOutstandingBalance = invoiceMetrics?.reduce((sum, invoice) => sum + (invoice.balance || 0), 0) || 0;
      
      // Calculate totals from purchase order data
      const totalPurchaseAmount = poMetrics?.reduce((sum, po) => sum + (po.total_amount || 0), 0) || 0;
      const totalPaymentsMade = poMetrics?.reduce((sum, po) => sum + (po.total_paid || 0), 0) || 0;
      const totalPurchaseBalance = poMetrics?.reduce((sum, po) => sum + (po.balance || 0), 0) || 0;
      
      // Count customers and vendors accurately using is_customer and is_vendor flags
      const totalCustomers = accountMetrics?.filter(account => account.is_customer).length || 0;
      const totalVendors = accountMetrics?.filter(account => account.is_vendor).length || 0;
      
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
      console.error('Unexpected error fetching business metrics:', error);
      setError(error.message || 'An unexpected error occurred');
      toast({
        title: 'Error',
        description: 'Failed to fetch business metrics. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    metrics,
    statusMetrics,
    isLoading,
    error,
    refreshMetrics: fetchBusinessMetrics
  };
}
