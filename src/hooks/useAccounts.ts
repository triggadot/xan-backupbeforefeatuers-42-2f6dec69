import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Account, GlAccount } from '@/types';
import { mapGlAccountToAccount } from '@/utils/mapping-utils';
import { normalizeClientType } from '@/utils/gl-account-mappings';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const fetchAccounts = useCallback(async (forceRefresh = false) => {
    if (accounts.length > 0 && !forceRefresh) return accounts;
    
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
  }, [accounts.length, toast]);

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
      // Generate a unique Glide row ID with a prefix and timestamp
      const glideRowId = `A-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Normalize client type to ensure it matches constraint
      const normalizedClientType = normalizeClientType(accountData.type);
      
      const { data, error } = await supabase
        .from('gl_accounts')
        .insert({
          account_name: accountData.name,
          client_type: normalizedClientType,
          email_of_who_added: accountData.email,
          photo: accountData.photo,
          glide_row_id: glideRowId,
          accounts_uid: accountData.accounts_uid || `ACC${Date.now().toString().slice(-6)}`
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
      if (accountData.type) {
        // Normalize client type to ensure it matches constraint
        updateData.client_type = normalizeClientType(accountData.type);
      }
      if (accountData.email) updateData.email_of_who_added = accountData.email;
      if (accountData.accounts_uid) updateData.accounts_uid = accountData.accounts_uid;
      if (accountData.photo) updateData.photo = accountData.photo;
      
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

  const syncAccounts = useCallback(async (mappingId: string) => {
    setIsSyncing(true);
    
    try {
      // Call the glsync edge function for syncing data
      const { data, error } = await supabase.functions.invoke('glsync', {
        body: {
          action: 'syncData',
          mappingId,
        },
      });
      
      if (error) throw error;
      
      // Refresh accounts after sync
      await fetchAccounts(true);
      
      toast({
        title: 'Sync Complete',
        description: `Synced ${data.recordsProcessed || 0} accounts successfully.`,
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync accounts';
      toast({
        title: 'Sync Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [fetchAccounts, toast]);

  // Set up realtime subscriptions
  useEffect(() => {
    fetchAccounts();
    
    // Set up a realtime subscription for account changes
    const channel = supabase
      .channel('gl-accounts-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'gl_accounts' 
        }, 
        () => {
          fetchAccounts(true);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAccounts]);

  return {
    accounts,
    isLoading,
    isSyncing,
    error,
    fetchAccounts,
    getAccount,
    addAccount,
    updateAccount,
    deleteAccount,
    syncAccounts
  };
}
