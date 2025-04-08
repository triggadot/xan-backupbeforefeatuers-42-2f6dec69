import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/utils/use-toast';

/**
 * Hook for account mutations (create, update, delete)
 * Uses the Glidebase pattern where relationships use rowid_ fields referencing glide_row_id values
 * 
 * @returns Object containing mutation functions and states
 * 
 * @example
 * // Create a new account
 * const { createAccount } = useAccountMutation();
 * createAccount({
 *   account_name: 'Acme Corp',
 *   client_type: 'Vendor',
 *   accounts_uid: 'ACME001'
 * });
 * 
 * // Update an existing account
 * const { updateAccount } = useAccountMutation();
 * updateAccount({
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   account: { account_name: 'Acme Corporation' }
 * });
 * 
 * // Delete an account
 * const { deleteAccount } = useAccountMutation();
 * deleteAccount('123e4567-e89b-12d3-a456-426614174000');
 */
export function useAccountMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: async (account: any) => {
      try {
        // Generate a unique glide_row_id if not provided
        if (!account.glide_row_id) {
          account.glide_row_id = `gl_accounts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        }
        
        // Ensure accounts_uid is set if not provided
        if (!account.accounts_uid) {
          account.accounts_uid = `${account.client_type || 'Account'}_${Date.now()}`;
        }
        
        const { data, error } = await supabase
          .from('gl_accounts')
          .insert(account)
          .select();
        
        if (error) throw error;
        
        return data[0];
      } catch (err) {
        console.error('Error creating account:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({
        title: 'Success',
        description: 'Account created successfully',
      });
    }
  });
  
  // Update account mutation
  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, account }: { id: string, account: any }) => {
      try {
        const { data, error } = await supabase
          .from('gl_accounts')
          .update(account)
          .eq('id', id)
          .select();
        
        if (error) throw error;
        
        return data[0];
      } catch (err) {
        console.error('Error updating account:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to update account';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account', variables.id] });
      toast({
        title: 'Success',
        description: 'Account updated successfully',
      });
    }
  });
  
  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('gl_accounts')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        return true;
      } catch (err) {
        console.error('Error deleting account:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete account';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account', id] });
      toast({
        title: 'Success',
        description: 'Account deleted successfully',
      });
    }
  });
  
  return {
    createAccount: createAccountMutation.mutate,
    updateAccount: updateAccountMutation.mutate,
    deleteAccount: deleteAccountMutation.mutate,
    isCreating: createAccountMutation.isPending,
    isUpdating: updateAccountMutation.isPending,
    isDeleting: deleteAccountMutation.isPending
  };
}
