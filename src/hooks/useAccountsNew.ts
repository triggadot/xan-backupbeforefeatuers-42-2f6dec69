
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Account } from '@/types/accountNew';
import { 
  fetchAllAccounts, 
  fetchAccountById, 
  createAccount, 
  updateAccount as updateAccountService, 
  deleteAccount as deleteAccountService 
} from '@/services/accountService';

export function useAccountsNew() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedAccounts = await fetchAllAccounts();
      setAccounts(fetchedAccounts);
      return fetchedAccounts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch accounts';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getAccount = useCallback(async (id: string) => {
    try {
      return await fetchAccountById(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch account';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const addAccount = useCallback(async (accountData: Omit<Account, 'id' | 'created_at' | 'updated_at' | 'is_customer' | 'is_vendor' | 'invoice_count' | 'total_invoiced' | 'total_paid' | 'last_invoice_date' | 'last_payment_date'>) => {
    try {
      await createAccount(accountData);
      
      // Fetch the newly created account from the materialized view to get all the details
      const newAccount = await getAccount(accountData.id);
      
      if (newAccount) {
        setAccounts(prev => [...prev, newAccount]);
      }
      
      toast({
        title: 'Account Created',
        description: `${accountData.name} has been added successfully.`,
      });
      
      return newAccount;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast, getAccount]);

  const updateAccount = useCallback(async (id: string, accountData: Partial<Account>) => {
    try {
      await updateAccountService(id, accountData);
      
      // Fetch the updated account from the materialized view
      const updatedAccount = await getAccount(id);
      
      if (updatedAccount) {
        setAccounts(prev => prev.map(account => 
          account.id === id ? updatedAccount : account
        ));
      }
      
      toast({
        title: 'Account Updated',
        description: `${accountData.name || 'Account'} has been updated successfully.`,
      });
      
      return updatedAccount;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update account';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast, getAccount]);

  const deleteAccount = useCallback(async (id: string) => {
    try {
      await deleteAccountService(id);
      
      setAccounts(prev => prev.filter(account => account.id !== id));
      
      toast({
        title: 'Account Deleted',
        description: 'The account has been deleted successfully.',
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete account';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Fetch accounts on component mount
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    isLoading,
    error,
    fetchAccounts,
    getAccount,
    addAccount,
    updateAccount,
    deleteAccount
  };
}
