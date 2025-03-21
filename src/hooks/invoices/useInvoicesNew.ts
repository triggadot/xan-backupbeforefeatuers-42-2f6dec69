
import { useState } from 'react';
import { useFetchInvoices } from './useFetchInvoices';
import { useInvoiceDetail } from './useInvoiceDetail';
import { useInvoicePayments } from './useInvoicePayments';
import { useInvoiceLineItems } from './useInvoiceLineItems';
import { useInvoiceDeletion } from './useInvoiceDeletion';
import { InvoiceFilters } from '@/types/invoice';

export function useInvoicesNew(filters?: InvoiceFilters) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Import functionality from smaller hooks
  const { fetchInvoices: baseFetchInvoices } = useFetchInvoices();
  const { getInvoice } = useInvoiceDetail();
  const { addPayment, deletePayment } = useInvoicePayments();
  const { deleteLineItem } = useInvoiceLineItems();
  const { deleteInvoice } = useInvoiceDeletion();

  // Wrapper to apply filters (for future implementation)
  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      // Here we could apply filters in the future
      const result = await baseFetchInvoices();
      return result.data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching invoices');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchInvoices,
    getInvoice,
    addPayment,
    deletePayment,
    deleteLineItem,
    deleteInvoice,
    isLoading,
    error
  };
}
