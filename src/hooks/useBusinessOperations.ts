
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BusinessMetrics, StatusMetrics, BusinessOperations } from '@/types/business';
import { determineAccountType, extractAccountFlags } from '@/utils/accountMapper';

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
        .from('gl_accounts')
        .select('id, client_type');
        
      if (accountError) throw accountError;
      
      // Count customers and vendors accurately based on client_type field
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
    isLoading,
    error,
    refreshMetrics: fetchBusinessMetrics,
    determineAccountType,
    extractAccountFlags,
    calculateTotalBalance,
    calculateAmountDue,
    determineInvoiceStatus,
    determinePurchaseOrderStatus
  };
}
