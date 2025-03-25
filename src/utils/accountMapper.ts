
/**
 * Utilities for mapping account data between database and frontend models
 */
import { GlAccount } from '@/types/account';
import { Account } from '@/types/accountNew';

/**
 * Determines the account type from the client_type field
 */
export function determineAccountType(clientType?: string): 'customer' | 'vendor' | 'both' | 'unknown' {
  if (!clientType) return 'unknown';
  
  const normalizedType = clientType.toLowerCase();
  
  if (normalizedType.includes('customer') && normalizedType.includes('vendor')) {
    return 'both';
  } else if (normalizedType.includes('customer')) {
    return 'customer';
  } else if (normalizedType.includes('vendor')) {
    return 'vendor';
  }
  
  return 'unknown';
}

/**
 * Extracts customer and vendor flags from the client_type field
 */
export function extractAccountFlags(clientType?: string) {
  const type = determineAccountType(clientType);
  
  return {
    is_customer: type === 'customer' || type === 'both',
    is_vendor: type === 'vendor' || type === 'both',
  };
}

/**
 * Gets a user-friendly account type label
 */
export function getAccountTypeLabel(type: 'customer' | 'vendor' | 'both' | 'unknown'): string {
  switch (type) {
    case 'customer':
      return 'Customer';
    case 'vendor':
      return 'Vendor';
    case 'both':
      return 'Customer & Vendor';
    default:
      return 'Unknown';
  }
}

/**
 * Maps a database GlAccount to a frontend Account model
 */
export function mapViewAccountToAccount(account: GlAccount): Account {
  const type = determineAccountType(account.client_type);
  const { is_customer, is_vendor } = extractAccountFlags(account.client_type);
  
  return {
    id: account.id,
    name: account.account_name,
    type: getAccountTypeLabel(type) as Account['type'],
    glide_row_id: account.glide_row_id,
    accounts_uid: account.accounts_uid,
    email: account.email_of_who_added,
    status: 'active',
    balance: Number(account.balance) || 0,
    photo: account.photo,
    created_at: account.created_at,
    updated_at: account.updated_at,
    is_customer,
    is_vendor
  };
}
