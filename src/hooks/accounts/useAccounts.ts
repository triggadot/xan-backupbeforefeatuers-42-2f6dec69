import { useFetchAccounts } from './useFetchAccounts';
import { useAccountDetail } from './useAccountDetail';
import { useAccountMutation } from './useAccountMutation';

/**
 * Consolidated hook for managing accounts (vendors and customers)
 * Combines functionality from useFetchAccounts, useAccountDetail, and useAccountMutation
 * Uses the Glidebase pattern where relationships use rowid_ fields referencing glide_row_id values
 * 
 * @param filters - Optional filters to apply to the accounts query
 * @returns Object containing accounts data and operations
 * 
 * @example
 * // Basic usage
 * const { accounts, isLoading } = useAccounts({ client_type: 'Vendor' });
 * 
 * // Create a new account
 * const { createAccount } = useAccounts();
 * createAccount({
 *   account_name: 'Acme Corp',
 *   client_type: 'Vendor',
 *   accounts_uid: 'ACME001'
 * });
 * 
 * // Get account details
 * const { getAccount } = useAccounts();
 * const accountDetails = await getAccount('123e4567-e89b-12d3-a456-426614174000');
 */
export function useAccounts(filters?: Record<string, any>) {
  // Use the specialized hooks
  const { accounts, isLoading, isError, error } = useFetchAccounts(filters);
  const { getAccount } = useAccountDetail();
  const { 
    createAccount, 
    updateAccount, 
    deleteAccount,
    isCreating,
    isUpdating,
    isDeleting
  } = useAccountMutation();
  
  // Return a combined API for backward compatibility
  return {
    accounts,
    isLoading,
    isError,
    error,
    getAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    isCreating,
    isUpdating,
    isDeleting
  };
}
