
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Account, GlAccount } from '@/types';
import { mapGlAccountToAccount } from '@/utils/mapping-utils';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('gl_accounts')
        .select('*')
        .order('account_name', { ascending: true });
      
      if (error) throw error;
      
      const mappedAccounts = (data || []).map((account: GlAccount) => mapGlAccountToAccount(account));
      setAccounts(mappedAccounts);
      
      return mappedAccounts;
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
      const { data, error } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return mapGlAccountToAccount(data as GlAccount);
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

  const addAccount = useCallback(async (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Map the type to the appropriate client_type format for database
      let clientType: string;
      switch (accountData.type) {
        case 'both':
          clientType = 'customer and vendor';
          break;
        case 'vendor':
        case 'customer':
          clientType = accountData.type;
          break;
        default:
          clientType = 'customer';
      }
      
      const { data, error } = await supabase
        .from('gl_accounts')
        .insert({
          account_name: accountData.name,
          client_type: clientType,
          email_of_who_added: accountData.email,
          glide_row_id: 'A-' + Date.now(), // Generate a temporary ID for Glide sync
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const newAccount = mapGlAccountToAccount(data as GlAccount);
      setAccounts(prev => [...prev, newAccount]);
      
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
  }, [toast]);

  const updateAccount = useCallback(async (id: string, accountData: Partial<Account>) => {
    try {
      // Convert from Account format to gl_accounts format
      const updateData: Partial<GlAccount> = {};
      if (accountData.name) updateData.account_name = accountData.name;
      
      // Map the type to the appropriate client_type format if provided
      if (accountData.type) {
        switch (accountData.type) {
          case 'both':
            updateData.client_type = 'customer and vendor';
            break;
          case 'vendor':
          case 'customer':
            updateData.client_type = accountData.type;
            break;
        }
      }
      
      if (accountData.email) updateData.email_of_who_added = accountData.email;
      
      const { data, error } = await supabase
        .from('gl_accounts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      const updatedAccount = mapGlAccountToAccount(data as GlAccount);
      setAccounts(prev => prev.map(account => 
        account.id === id ? updatedAccount : account
      ));
      
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
  }, [toast]);

  const deleteAccount = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('gl_accounts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
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
