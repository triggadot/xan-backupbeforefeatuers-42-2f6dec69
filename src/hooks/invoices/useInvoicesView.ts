
import { useState } from 'react';
import { useFetchInvoices } from './useFetchInvoices';
import { useInvoiceDetail } from './useInvoiceDetail';
import { useInvoicePayments } from './useInvoicePayments';
import { useInvoiceLineItems } from './useInvoiceLineItems';
import { useInvoiceMutation } from './useInvoiceMutation';
import { InvoiceFilters } from '@/types/invoice';

export function useInvoicesView(filters?: InvoiceFilters) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Import functionality from smaller hooks
  const { fetchInvoices: baseFetchInvoices } = useFetchInvoices();
  const { getInvoice } = useInvoiceDetail();
  const { addPayment, updatePayment, deletePayment } = useInvoicePayments();
  const { addLineItem, updateLineItem, deleteLineItem } = useInvoiceLineItems();
  const { createInvoice, updateInvoice, deleteInvoice } = useInvoiceMutation();

  // Wrapper to apply filters (for future implementation)
  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Here we could apply filters in the future
      const result = await baseFetchInvoices();
      if (result.error) {
        throw result.error;
      }
      return result.data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching invoices';
      setError(errorMessage);
      console.error('Error in useInvoicesView.fetchInvoices:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Functions
    fetchInvoices,
    getInvoice,
    
    // Mutations
    createInvoice,
    updateInvoice,
    deleteInvoice,
    
    // Line items
    addLineItem,
    updateLineItem,
    deleteLineItem,
    
    // Payments
    addPayment,
    updatePayment,
    deletePayment,
    
    // State
    isLoading,
    error
  };
}
