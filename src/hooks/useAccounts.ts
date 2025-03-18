
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Account } from '@/types';

export type GlAccountData = {
  id: string;
  glide_row_id: string;
  account_name: string;
  client_type: string;
  email_of_who_added: string;
  date_added_client: string;
  photo: string;
  accounts_uid: string;
  created_at: string;
  updated_at: string;
}

// Convert database format to Account format
const mapGlAccountToAccount = (glAccount: GlAccountData): Account => {
  return {
    id: glAccount.id,
    name: glAccount.account_name || 'Unnamed Account',
    type: (glAccount.client_type?.toLowerCase() as 'customer' | 'vendor' | 'both') || 'customer',
    email: glAccount.email_of_who_added || '',
    phone: '',
    address: '',
    website: '',
    notes: '',
    status: 'active',
    balance: 0,
    createdAt: new Date(glAccount.created_at),
    updatedAt: new Date(glAccount.updated_at)
  };
};

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
      
      const mappedAccounts = (data || []).map(mapGlAccountToAccount);
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

  const addAccount = useCallback(async (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('gl_accounts')
        .insert({
          account_name: accountData.name,
          client_type: accountData.type,
          email_of_who_added: accountData.email,
          glide_row_id: 'A-' + Date.now(), // Generate a temporary ID for Glide sync
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const newAccount = mapGlAccountToAccount(data as GlAccountData);
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
      const updateData: Partial<GlAccountData> = {};
      if (accountData.name) updateData.account_name = accountData.name;
      if (accountData.type) updateData.client_type = accountData.type;
      if (accountData.email) updateData.email_of_who_added = accountData.email;
      
      const { data, error } = await supabase
        .from('gl_accounts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      const updatedAccount = mapGlAccountToAccount(data as GlAccountData);
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
    addAccount,
    updateAccount,
    deleteAccount
  };
}
