
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useFetchInvoices() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch invoices from the materialized view
  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('mv_invoice_customer_details')
        .select('*');
        
      if (error) throw error;
      
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching invoices';
      setError(errorMessage);
      console.error('Error fetching invoices:', err);
      return { data: null, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchInvoices,
    isLoading,
    error
  };
}
