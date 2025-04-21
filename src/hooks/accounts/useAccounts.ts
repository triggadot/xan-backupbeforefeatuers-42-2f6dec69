
import { accountService } from '@/services/account-service';
import { useEntitiesQuery } from '../data/useEntityQuery';
import { useCreateEntity, useUpdateEntity, useDeleteEntity } from '../data/useEntityMutation';
import { Account } from '@/types/account';
import { useState, useMemo } from 'react';

export type AccountFilter = {
  searchTerm?: string;
  accountType?: 'customer' | 'vendor' | 'both' | null;
  status?: 'active' | 'inactive' | null;
};

export function useAccounts(initialFilters: AccountFilter = {}) {
  const [filters, setFilters] = useState<AccountFilter>(initialFilters);
  
  const query = useEntitiesQuery(accountService);
  
  const filteredAccounts = useMemo(() => {
    let result = query.data || [];
    
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter(account => 
        account.name.toLowerCase().includes(searchLower) ||
        account.email?.toLowerCase().includes(searchLower) ||
        account.accountsUid?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.accountType) {
      if (filters.accountType === 'customer') {
        result = result.filter(account => 
          account.type === 'Customer' || account.type === 'Customer & Vendor'
        );
      } else if (filters.accountType === 'vendor') {
        result = result.filter(account => 
          account.type === 'Vendor' || account.type === 'Customer & Vendor'
        );
      } else if (filters.accountType === 'both') {
        result = result.filter(account => account.type === 'Customer & Vendor');
      }
    }
    
    return result;
  }, [query.data, filters]);
  
  const updateFilters = (newFilters: Partial<AccountFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  const clearFilters = () => {
    setFilters({});
  };
  
  return {
    accounts: filteredAccounts,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    filters,
    updateFilters,
    clearFilters,
    refetch: query.refetch
  };
}

export function useAccountMutations() {
  const createMutation = useCreateEntity(accountService);
  const updateMutation = useUpdateEntity(accountService, '');
  const deleteMutation = useDeleteEntity(accountService);
  
  return {
    createAccount: (data: Partial<Account>) => createMutation.mutateAsync(data),
    updateAccount: (id: string, data: Partial<Account>) => 
      updateMutation.mutateAsync({ ...data }, { context: { id } }),
    deleteAccount: (id: string) => deleteMutation.mutateAsync(id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}
