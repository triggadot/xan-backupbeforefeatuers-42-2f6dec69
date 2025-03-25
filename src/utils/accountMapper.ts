
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
