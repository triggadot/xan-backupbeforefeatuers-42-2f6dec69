
/**
 * Utilities for mapping account data
 */

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
export function extractAccountFlags(clientType: 'Customer' | 'Vendor' | 'Customer & Vendor' | string) {
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
 * Maps a database account to a frontend Account model
 */
export function mapViewAccountToAccount(account: any) {
  const type = determineAccountType(account.client_type);
  
  return {
    id: account.id,
    name: account.account_name,
    type: getAccountTypeLabel(type),
    email: account.email_of_who_added,
    status: 'active',
    balance: account.balance || 0,
    photo: account.photo,
    createdAt: new Date(account.created_at),
    updatedAt: account.updated_at ? new Date(account.updated_at) : undefined
  };
}
