
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
      // Fetch invoice metrics
      const { data: invoiceMetrics, error: invoiceError } = await supabase
        .rpc('gl_get_invoice_metrics');
      
      if (invoiceError) throw invoiceError;
      
      // Fetch purchase order metrics
      const { data: poMetrics, error: poError } = await supabase
        .rpc('gl_get_purchase_order_metrics');
      
      if (poError) throw poError;
      
      // Fetch product and account counts
      const { data: productCount, error: productError } = await supabase
        .from('gl_products')
        .select('id', { count: 'exact', head: true });
      
      if (productError) throw productError;
      
      // Fetch customer and vendor counts
      const { data: accountStats, error: accountError } = await supabase
        .rpc('gl_get_account_stats');
      
      if (accountError) throw accountError;
      
      // Combine data into business metrics
      const combinedMetrics: BusinessMetrics = {
        total_invoices: invoiceMetrics?.invoice_count || 0,
        total_estimates: invoiceMetrics?.estimate_count || 0,
        total_invoice_amount: invoiceMetrics?.total_invoice_amount || 0,
        total_payments_received: invoiceMetrics?.total_payments_received || 0,
        total_outstanding_balance: invoiceMetrics?.total_outstanding_balance || 0,
        total_purchase_orders: poMetrics?.po_count || 0,
        total_purchase_amount: poMetrics?.total_purchase_amount || 0,
        total_payments_made: poMetrics?.total_payments_made || 0,
        total_purchase_balance: poMetrics?.total_purchase_balance || 0,
        total_products: productCount?.count || 0,
        total_customers: accountStats?.customer_count || 0,
        total_vendors: accountStats?.vendor_count || 0
      };
      
      setMetrics(combinedMetrics);
      
      // Fetch document status metrics separately
      const { data: docStatusData, error: statusError } = await supabase
        .rpc('gl_get_document_status');
      
      if (statusError) throw statusError;
      
      setStatusMetrics(docStatusData || []);
      
    } catch (error: any) {
      console.error('Error fetching business metrics:', error);
      setError(error.message);
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
