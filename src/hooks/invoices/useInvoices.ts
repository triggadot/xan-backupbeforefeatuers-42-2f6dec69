
import { useState, useMemo } from 'react';
import { invoiceService } from '@/services/invoice-service';
import { useEntitiesQuery } from '../data/useEntityQuery';
import { useCreateEntity, useUpdateEntity, useDeleteEntity } from '../data/useEntityMutation';
import { Invoice } from '@/types/invoice';

export type InvoiceFilter = {
  searchTerm?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
};

export function useInvoices(initialFilters: InvoiceFilter = {}) {
  const [filters, setFilters] = useState<InvoiceFilter>(initialFilters);
  
  const query = useEntitiesQuery(invoiceService);
  
  const filteredInvoices = useMemo(() => {
    let result = query.data || [];
    
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter(invoice => 
        invoice.invoiceUid.toLowerCase().includes(searchLower) ||
        invoice.account?.name?.toLowerCase().includes(searchLower) ||
        invoice.notes?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.status) {
      result = result.filter(invoice => 
        invoice.status?.toLowerCase() === filters.status?.toLowerCase()
      );
    }
    
    if (filters.accountId) {
      result = result.filter(invoice => 
        invoice.accountId === filters.accountId
      );
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      result = result.filter(invoice => 
        invoice.date ? new Date(invoice.date) >= fromDate : true
      );
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      result = result.filter(invoice => 
        invoice.date ? new Date(invoice.date) <= toDate : true
      );
    }
    
    return result;
  }, [query.data, filters]);
  
  const updateFilters = (newFilters: Partial<InvoiceFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  const clearFilters = () => {
    setFilters({});
  };
  
  return {
    invoices: filteredInvoices,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    filters,
    updateFilters,
    clearFilters,
    refetch: query.refetch
  };
}

export function useInvoiceMutations() {
  const createMutation = useCreateEntity(invoiceService);
  const updateMutation = useUpdateEntity(invoiceService, '');
  const deleteMutation = useDeleteEntity(invoiceService);
  
  return {
    createInvoice: (data: Partial<Invoice>) => createMutation.mutateAsync(data),
    updateInvoice: (id: string, data: Partial<Invoice>) => {
      const updatedData = { ...data, id };
      return updateMutation.mutateAsync(updatedData, { context: { id } });
    },
    deleteInvoice: (id: string) => deleteMutation.mutateAsync(id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}
