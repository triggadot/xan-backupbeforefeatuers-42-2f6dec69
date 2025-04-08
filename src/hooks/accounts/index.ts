/**
 * Account hooks index file
 * Exports all account-related hooks for easy importing
 */

export { useFetchAccounts } from './useFetchAccounts';
export { useAccountDetail } from './useAccountDetail';
export { useAccountMutation } from './useAccountMutation';
export { useAccount } from './useAccount';

/**
 * Main account hook that combines functionality from all account hooks
 * This is provided for backward compatibility and convenience
 */
export { useAccounts } from './useAccounts';
