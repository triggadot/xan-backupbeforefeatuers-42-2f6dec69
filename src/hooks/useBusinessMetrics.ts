
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
      // Fetch overall business metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('gl_business_metrics')
        .select('*')
        .single();
      
      if (metricsError) throw metricsError;
      
      // Fetch status metrics for different document types
      const { data: statusData, error: statusError } = await supabase
        .from('gl_current_status')
        .select('*')
        .order('category');
      
      if (statusError) throw statusError;
      
      setMetrics(metricsData);
      setStatusMetrics(statusData);
    } catch (error: any) {
      console.error('Error fetching business metrics:', error);
      setError(error.message);
      toast({
        title: 'Error',
        description: 'Failed to fetch business metrics.',
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
